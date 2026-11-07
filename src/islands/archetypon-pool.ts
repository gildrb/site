// Copied from archetypon web/src/pool.ts (the engine repo); change it there first,
// then copy it here again (importing ./archetypon-protocol.ts).
// Runs conversions on a few warm workers at once. The engine is compiled
// once per page, by the first worker, and shared with the rest; each
// conversion is split into shards (one raster size each, and the vector
// formats), and their archives are joined into the one a single worker
// would make.

import {
  decodeReply,
  type Command,
  type FontInput,
  type Format,
  type Output,
  type Reply,
  type Request,
  type SvgInput,
} from "./archetypon-protocol.ts";

/** The most workers a page runs; past this the shards stop getting shorter. */
const MAX_WORKERS = 8;
/** What a conversion may hold in memory at once, in MiB, when the device does not say. */
const DEFAULT_BUDGET = 2048;
/** The formats made at every raster size: each size is a shard of its own. */
const RASTER: Readonly<Record<Format, boolean>> = {
  svg: false,
  pdf: false,
  png: true,
  webp: true,
  jpeg: true,
  ico: false,
};

/**
 * One engine configuration and the formats made with it. The engine takes
 * its options once, before the first SVG, so formats that need different
 * options (another background) are separate passes.
 */
export type Pass = {
  formats: Format[];
  sizes: number[];
  /** A CSS color, or empty for transparent. */
  background: string;
  quality: string;
};

export type Job = { svgs: SvgInput[]; fonts: FontInput[]; passes: Pass[] };

/**
 * What a running conversion reports: the replies one worker running the
 * passes in turn would send. Each step is reported once, when all of its
 * shards are done; a failure is reported once its pass has tried the SVG
 * in every shard, with the message of its earliest format.
 */
export type Progress = Extract<
  Reply,
  {
    type: "font" | "font-error" | "open" | "step" | "stepped" | "converted" | "failed";
  }
>;

export type Outcome =
  /** The archive, or null when no SVG converted; `ms` is the wall time. */
  | { type: "done"; zip: Uint8Array<ArrayBuffer> | null; ms: number }
  /** The engine stopped the whole conversion. */
  | { type: "failed"; message: string }
  /** A worker could not start. */
  | { type: "crashed"; message: string }
  /** A newer conversion or `cancel` replaced it. */
  | { type: "cancelled" };

/**
 * One request to a worker: some formats of one pass. The engine renders
 * each size once per SVG and encodes every raster format from it, so a
 * raster shard is one size of all of its pass's raster formats; the vector
 * formats and the ICO, which renders its own sizes, share another.
 */
type Shard = {
  pass: number;
  /** In their pass's order. */
  formats: Format[];
  /** The shard's place among its formats' shards, smallest size first. */
  rank: number;
  /** How many shards its formats are split into. */
  shards: number;
  sizes: number[];
  /** A guess at its memory, in MiB, and at its work, in raster pixels. */
  memory: number;
  work: number;
};

/** Where a file goes in the archive: pass, SVG, format, rank, file. */
type Order = readonly number[];

function compare(first: Order, second: Order): number {
  for (const [index, value] of first.entries()) {
    const other = second[index] ?? 0;
    if (value !== other) {
      return value - other;
    }
  }
  return first.length - second.length;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function dosTime(date: Date): number {
  const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
  return (
    (((year - 1980) << 25) |
      ((date.getMonth() + 1) << 21) |
      (date.getDate() << 16) |
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      (date.getSeconds() >> 1)) >>>
    0
  );
}

/** Whether the user asked the browser to save data (Chromium says). */
function savingData(): boolean {
  if (!("connection" in navigator)) {
    return false;
  }
  const { connection } = navigator;
  return (
    typeof connection === "object" &&
    connection !== null &&
    "saveData" in connection &&
    connection.saveData === true
  );
}

/** The device's memory in GiB, where the browser says (Chromium does). */
function deviceMemory(): number | null {
  return "deviceMemory" in navigator &&
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory > 0
    ? navigator.deviceMemory
    : null;
}

/**
 * The shards of a job, the largest first. A raster shard's memory is its
 * pixels several times over (the render, and each format's encoding); its
 * work is its pixels for each format. The vector shard makes no large
 * raster.
 */
function plan(passes: readonly Pass[]): Shard[] {
  const shards: Shard[] = [];
  for (const [pass, { formats, sizes }] of passes.entries()) {
    const vector = formats.filter((format) => !RASTER[format]);
    const raster = formats.filter((format) => RASTER[format]);
    if (vector.length > 0) {
      // The engine checks the sizes for every format; give it them all.
      shards.push({
        pass,
        formats: vector,
        rank: 0,
        shards: 1,
        sizes,
        memory: 64,
        work: 512 * 512 * vector.length,
      });
    }
    if (raster.length === 0) {
      continue;
    }
    // The engine sorts and dedups the sizes the same way. An empty size
    // list stays one shard, for the engine to refuse.
    const sorted = [...new Set(sizes)].toSorted((a, b) => a - b);
    const chunks = sorted.length > 0 ? sorted.map((size) => [size]) : [sizes];
    for (const [rank, chunk] of chunks.entries()) {
      const edge = Math.max(0, ...chunk);
      shards.push({
        pass,
        formats: raster,
        rank,
        shards: chunks.length,
        sizes: chunk,
        memory: 32 + (edge * edge * (16 + 8 * raster.length)) / 2 ** 20,
        work: edge * edge * (1 + raster.length),
      });
    }
  }
  return shards.toSorted((a, b) => b.work - a.work);
}

/** A stored ZIP entry: its local header with data, and its directory record. */
type Entry = { name: string; local: Uint8Array; central: Uint8Array };

function readZip(zip: ArrayBuffer): Entry[] {
  const bytes = new Uint8Array(zip);
  const view = new DataView(zip);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) {
    end -= 1;
  }
  if (end < 0) {
    throw new Error("an archive has no end record");
  }
  const total = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries: Entry[] = [];
  for (let index = 0; index < total; index += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) {
      throw new Error("an archive entry is broken");
    }
    const nameLength = view.getUint16(at + 28, true);
    const length = 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const start = view.getUint32(at + 42, true);
    const stored =
      30 +
      view.getUint16(start + 26, true) +
      view.getUint16(start + 28, true) +
      view.getUint32(at + 20, true);
    entries.push({
      name: decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength)),
      local: bytes.subarray(start, start + stored),
      central: bytes.slice(at, at + length),
    });
    at += length;
  }
  return entries;
}

/** The entries as one archive: their data in order, then their directory. */
function writeZip(entries: readonly Entry[]): Uint8Array<ArrayBuffer> {
  const data = entries.reduce((sum, entry) => sum + entry.local.length, 0);
  const directory = entries.reduce((sum, entry) => sum + entry.central.length, 0);
  if (entries.length > 0xffff || data + directory + 22 > 0xffffffff) {
    throw new Error("the archive is too large");
  }
  const zip = new Uint8Array(data + directory + 22);
  const view = new DataView(zip.buffer);
  let offset = 0;
  let at = data;
  for (const entry of entries) {
    zip.set(entry.local, offset);
    zip.set(entry.central, at);
    view.setUint32(at + 42, offset, true);
    offset += entry.local.length;
    at += entry.central.length;
  }
  view.setUint32(at, 0x06054b50, true);
  view.setUint16(at + 8, entries.length, true);
  view.setUint16(at + 10, entries.length, true);
  view.setUint32(at + 12, directory, true);
  view.setUint32(at + 16, data, true);
  return zip;
}

/** One conversion's shards and what they have reported so far. */
class Conversion {
  readonly #job: Job;
  readonly #report: (progress: Progress) => void;
  readonly #stamp = dosTime(new Date());
  readonly #started = performance.now();
  readonly #queue: Shard[];
  /** The shard whose font replies are reported; every shard reads the fonts. */
  readonly #fonts: Shard | undefined;
  /** How many shards each pass has. */
  readonly #widths: number[];
  #left: number;
  #opened = new Set<number>();
  #stepping = new Set<string>();
  /** The format each shard is making, for the SVG it is on. */
  #making = new Map<Shard, { index: number; format: Format }>();
  /** The files of a pass's SVG's format, by shard rank, until all arrive. */
  #steps = new Map<string, (Output[] | null)[]>();
  /** Per pass and SVG: the shards yet to finish it, and its earliest failure. */
  #ends = new Map<string, { left: number; failure: { order: Order; reply: Progress } | null }>();
  /** The passes and SVGs that failed, whose files leave the archive. */
  #failed = new Set<string>();
  #orders = new Map<string, Order>();
  #zips: ArrayBuffer[] = [];

  constructor(job: Job, report: (progress: Progress) => void) {
    this.#job = job;
    this.#report = report;
    this.#queue = job.svgs.length > 0 ? plan(job.passes) : [];
    this.#fonts = this.#queue[0];
    this.#left = this.#queue.length;
    this.#widths = job.passes.map(
      (_, pass) => this.#queue.filter((shard) => shard.pass === pass).length,
    );
  }

  get empty(): boolean {
    return this.#left === 0;
  }

  /** The next shard to send, if it fits beside `memory` MiB already running. */
  next(memory: number, budget: number): Shard | null {
    const index = this.#queue.findIndex((shard) => memory === 0 || memory + shard.memory <= budget);
    return index < 0 ? null : (this.#queue.splice(index, 1)[0] ?? null);
  }

  request(shard: Shard): Request {
    const { background, quality } = this.#job.passes[shard.pass] ?? {
      background: "",
      quality: "",
    };
    return {
      svgs: this.#job.svgs,
      fonts: this.#job.fonts,
      formats: shard.formats,
      options: [
        `sizes=${shard.sizes.join(",")}`,
        `background=${background}`,
        `jpeg-quality=${quality}`,
        "",
      ].join("\n"),
      stamp: this.#stamp,
    };
  }

  /** A format's place in its pass. */
  #position(shard: Shard, format: Format): number {
    return this.#job.passes[shard.pass]?.formats.indexOf(format) ?? -1;
  }

  progress(shard: Shard, reply: Progress): void {
    switch (reply.type) {
      case "font":
      case "font-error":
        if (shard === this.#fonts) {
          this.#report(reply);
        }
        return;
      case "open":
        if (!this.#opened.has(reply.index)) {
          this.#opened.add(reply.index);
          this.#report(reply);
        }
        return;
      case "step": {
        this.#making.set(shard, { index: reply.index, format: reply.format });
        const key = `${shard.pass} ${reply.index} ${reply.format}`;
        if (!this.#stepping.has(key)) {
          this.#stepping.add(key);
          this.#report(reply);
        }
        return;
      }
      case "stepped": {
        const order = [shard.pass, reply.index, this.#position(shard, reply.format), shard.rank];
        for (const [file, { path }] of reply.files.entries()) {
          this.#orders.set(path, [...order, file]);
        }
        const key = `${shard.pass} ${reply.index} ${reply.format}`;
        const parts =
          this.#steps.get(key) ?? Array.from({ length: shard.shards }, (): Output[] | null => null);
        parts[shard.rank] = reply.files;
        this.#steps.set(key, parts);
        const files: Output[] = [];
        for (const part of parts) {
          if (part === null) {
            return;
          }
          files.push(...part);
        }
        this.#report({ ...reply, files });
        return;
      }
      case "converted":
      case "failed": {
        const key = `${shard.pass} ${reply.index}`;
        const end = this.#ends.get(key) ?? {
          left: this.#widths[shard.pass] ?? 0,
          failure: null,
        };
        this.#ends.set(key, end);
        end.left -= 1;
        // The format it failed at; none when it failed to open.
        const making = this.#making.get(shard);
        const order = [
          making?.index === reply.index ? this.#position(shard, making.format) : -1,
          shard.rank,
        ];
        if (
          reply.type === "failed" &&
          (end.failure === null || compare(order, end.failure.order) < 0)
        ) {
          end.failure = { order, reply };
        }
        if (end.left > 0) {
          return;
        }
        if (end.failure === null) {
          this.#report({ type: "converted", index: reply.index });
        } else {
          this.#failed.add(key);
          this.#report(end.failure.reply);
        }
        return;
      }
    }
  }

  /** Takes a shard's archive; after the last, the job's outcome. */
  finish(zip: ArrayBuffer | null): Outcome | null {
    if (zip !== null) {
      this.#zips.push(zip);
    }
    this.#left -= 1;
    if (this.#left > 0) {
      return null;
    }
    try {
      return {
        type: "done",
        zip: this.#join(),
        ms: performance.now() - this.#started,
      };
    } catch (error) {
      return {
        type: "failed",
        message: `the archive could not be made (${message(error)})`,
      };
    }
  }

  /**
   * The shards' archives as one, in the order of one worker's passes: by
   * pass, SVG, format and size. A pass's SVG that failed in any shard
   * leaves all of that pass's files out, as the engine drops them.
   */
  #join(): Uint8Array<ArrayBuffer> | null {
    const kept: { order: Order; entry: Entry }[] = [];
    for (const zip of this.#zips) {
      for (const entry of readZip(zip)) {
        const order = this.#orders.get(entry.name);
        if (order === undefined) {
          throw new Error(`${entry.name} was never reported`);
        }
        if (!this.#failed.has(`${order[0]} ${order[1]}`)) {
          kept.push({ order, entry });
        }
      }
    }
    if (kept.length === 0) {
      return null;
    }
    return writeZip(kept.toSorted((a, b) => compare(a.order, b.order)).map(({ entry }) => entry));
  }
}

/**
 * Warm workers for one page. `script` is worker.js; `wasm` the URL of
 * archetypon.wasm, which the first worker compiles and the page hands to
 * the others as a module.
 */
export class Pool {
  readonly #script: string | URL;
  readonly #wasm: string;
  readonly #size: number;
  readonly #budget: number;
  #module: WebAssembly.Module | null = null;
  /** The worker compiling the engine, until it sends the module. */
  #loader: Worker | null = null;
  /** Workers started before the module arrived, that are yet to get it. */
  #waiting = new Set<Worker>();
  #idle: Worker[] = [];
  #busy = new Map<Worker, Shard>();
  #job: {
    conversion: Conversion;
    resolve: (outcome: Outcome) => void;
  } | null = null;

  constructor(script: string | URL, wasm: string) {
    this.#script = script;
    this.#wasm = wasm;
    const memory = deviceMemory();
    this.#size = Math.max(
      1,
      Math.min(
        navigator.hardwareConcurrency || 1,
        MAX_WORKERS,
        memory === null ? MAX_WORKERS : Math.floor(memory),
      ),
    );
    this.#budget = memory === null ? DEFAULT_BUDGET : (memory * 1024) / 4;
  }

  /**
   * Warms once the page has loaded and gone idle, off its critical path,
   * unless the browser is saving data. Returns a function that calls it off.
   */
  warmWhenIdle(): () => void {
    let timer: number | undefined;
    let idle: number | null = null;
    const start = () => {
      if (!savingData()) {
        this.warm();
      }
    };
    const schedule = () => {
      if (typeof requestIdleCallback === "function") {
        idle = requestIdleCallback(start, { timeout: 2000 });
      } else {
        timer = window.setTimeout(start, 200);
      }
    };
    if (document.readyState === "complete") {
      schedule();
    } else {
      addEventListener("load", schedule, { once: true });
    }
    return () => {
      removeEventListener("load", schedule);
      if (idle !== null) {
        cancelIdleCallback(idle);
      }
      clearTimeout(timer);
    };
  }

  /** Starts the workers and the engine's download, if not yet started. */
  warm(): void {
    while (this.#idle.length + this.#busy.size < this.#size) {
      this.#spawn();
    }
  }

  /** Runs a job, cancelling the one before it. */
  convert(job: Job, report: (progress: Progress) => void): Promise<Outcome> {
    this.cancel();
    const conversion = new Conversion(job, report);
    if (conversion.empty) {
      return Promise.resolve({ type: "done", zip: null, ms: 0 });
    }
    const { promise, resolve } = Promise.withResolvers<Outcome>();
    this.#job = { conversion, resolve };
    this.warm();
    this.#dispatch();
    return promise;
  }

  /** Stops the running job: its workers are replaced by the next `warm`. */
  cancel(): void {
    this.#end({ type: "cancelled" });
  }

  /** Stops every worker; a later `warm` or `convert` starts again. */
  dispose(): void {
    this.cancel();
    for (const worker of this.#idle) {
      worker.terminate();
    }
    this.#idle = [];
    this.#waiting.clear();
    this.#loader = null;
  }

  #spawn(): void {
    const worker = new Worker(this.#script, { type: "module" });
    worker.addEventListener("message", ({ data }: MessageEvent<unknown>) =>
      this.#message(worker, data),
    );
    worker.addEventListener("error", (event) => {
      event.preventDefault();
      this.#crash(event.message);
    });
    this.#idle.push(worker);
    if (this.#module !== null) {
      this.#load(worker, this.#module);
    } else if (this.#loader === null) {
      this.#loader = worker;
      this.#load(worker, this.#wasm);
    } else {
      this.#waiting.add(worker);
    }
  }

  #load(worker: Worker, wasm: string | WebAssembly.Module): void {
    // Warm the engine on a sample only while no file waits for it.
    const command: Command = { type: "load", wasm, warm: this.#job === null };
    try {
      worker.postMessage(command, []);
    } catch {
      // A browser that cannot share modules: this worker compiles its own.
      this.#load(worker, this.#wasm);
    }
  }

  #dispatch(): void {
    const job = this.#job;
    if (job === null) {
      return;
    }
    let memory = 0;
    for (const shard of this.#busy.values()) {
      memory += shard.memory;
    }
    for (;;) {
      const worker = this.#idle.at(-1);
      const shard = worker && job.conversion.next(memory, this.#budget);
      if (worker === undefined || !shard) {
        return;
      }
      this.#idle.pop();
      this.#busy.set(worker, shard);
      memory += shard.memory;
      const command: Command = {
        type: "convert",
        request: job.conversion.request(shard),
      };
      worker.postMessage(command, []);
    }
  }

  #message(worker: Worker, data: unknown): void {
    const reply = decodeReply(data);
    if (reply === null) {
      this.#end({
        type: "failed",
        message: "the converter sent something it should not have",
      });
      return;
    }
    switch (reply.type) {
      case "loaded":
        this.#module = reply.module;
        this.#loader = null;
        for (const other of this.#waiting) {
          this.#load(other, reply.module);
        }
        this.#waiting.clear();
        return;
      case "error":
        // Without an engine, start over at the next conversion.
        if (this.#module === null) {
          this.#end({ type: "failed", message: reply.message });
          this.dispose();
        } else if (this.#busy.has(worker)) {
          this.#end({ type: "failed", message: reply.message });
        }
        return;
      case "done": {
        const job = this.#job;
        if (job === null || !this.#busy.delete(worker)) {
          return;
        }
        this.#idle.push(worker);
        const outcome = job.conversion.finish(reply.zip);
        if (outcome === null) {
          this.#dispatch();
        } else {
          this.#end(outcome);
        }
        return;
      }
      case "font":
      case "font-error":
      case "open":
      case "step":
      case "stepped":
      case "converted":
      case "failed": {
        const shard = this.#busy.get(worker);
        if (shard !== undefined) {
          this.#job?.conversion.progress(shard, reply);
        }
      }
    }
  }

  #crash(reason: string): void {
    this.#end({
      type: "crashed",
      message: reason || "worker.js or archetypon.wasm did not load",
    });
    this.dispose();
  }

  /** Settles the job; the workers still busy with it are stopped. */
  #end(outcome: Outcome): void {
    const job = this.#job;
    this.#job = null;
    for (const worker of this.#busy.keys()) {
      worker.terminate();
      this.#waiting.delete(worker);
      if (worker === this.#loader) {
        this.#loader = null;
      }
    }
    this.#busy.clear();
    // The engine is still to come and its compiler is gone: the next
    // worker to start compiles it.
    if (this.#module === null && this.#loader === null) {
      const [next] = this.#waiting;
      if (next !== undefined) {
        this.#waiting.delete(next);
        this.#loader = next;
        this.#load(next, this.#wasm);
      }
    }
    job?.resolve(outcome);
  }
}
