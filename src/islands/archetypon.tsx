import * as stylex from "@stylexjs/stylex";
import type { TargetedEvent } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { colors, media, space, typeScale } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";
import { type Pass, Pool } from "./archetypon-pool.ts";
import { FORMATS, isFormat, type Format, type Output } from "./archetypon-protocol.ts";

/**
 * Archetypon in the browser. The engine is the tool's own web build, copied unchanged into
 * `public/tools/archetypon/`: module workers that run `archetypon.wasm` on the files they are
 * sent, a few at once (`archetypon-pool.ts`). Nothing leaves the device.
 */
const engine = "/tools/archetypon/worker.js";

const labels: Record<Format, string> = {
  svg: "SVG",
  pdf: "PDF",
  png: "PNG",
  webp: "WebP",
  jpeg: "JPEG",
  ico: "ICO",
};

/** The engine's exit code for an SVG with text but no fonts to set it in. */
const noFonts = 2;
/** The raster sizes, in pixels: every PNG, WebP and JPEG export has all of them. */
const rasterSizes = [16, 32, 48, 64, 128, 256, 512, 1024, 2048, 4096] as const;
const rasterRange = `${rasterSizes[0]}–${rasterSizes[rasterSizes.length - 1]} px`;
/**
 * What each format's file is made of, as the engine makes it (archetypon `lib.rs`): SVG and PDF
 * stay vector; PNG, WebP and JPEG take every raster size; ICO always packs 16, 32 and 48.
 */
const sizeText: Record<Format, string> = {
  svg: "Vector",
  pdf: "Vector",
  png: rasterRange,
  webp: rasterRange,
  jpeg: rasterRange,
  ico: "16, 32, 48",
};
/** What fills behind the artwork of a raster format or the ICO. */
type Background = "transparent" | "white" | "black";
const fills: Record<Background, string> = { transparent: "", white: "#ffffff", black: "#000000" };
const backgroundLabels: Record<Background, string> = {
  transparent: "Transparent",
  white: "White",
  black: "Black",
};
/** The formats with a background; SVG and PDF stay vector. */
type Filled = "png" | "webp" | "jpeg" | "ico";
const isFilled = (format: Format): format is Filled =>
  format === "png" || format === "webp" || format === "jpeg" || format === "ico";
/**
 * What a click on a format's background steps to. JPEG has no transparency, so it only switches
 * between white and black.
 */
function nextBackground(format: Filled, background: Background): Background {
  if (format === "jpeg") return background === "black" ? "white" : "black";
  return background === "transparent" ? "white" : background === "white" ? "black" : "transparent";
}
const startBackgrounds: Readonly<Record<Filled, Background>> = {
  png: "transparent",
  webp: "transparent",
  jpeg: "white",
  ico: "transparent",
};

type Step = "pending" | "running" | "done";
type Result = {
  name: string;
  preview: string | null;
  size: string | null;
  steps: { format: Format; state: Step }[];
  files: Output[];
  error: string | null;
};
type Font = { text: string; error: boolean };
type Status = { text: string; error: boolean };
type Download = { url: string; name: string; bytes: number };

function kind(name: string): "svg" | "font" | null {
  if (/\.svgz?$/i.test(name)) return "svg";
  if (/\.(ttf|otf|ttc)$/i.test(name)) return "font";
  return null;
}

const stem = (name: string) => name.replace(/\.svgz?$/i, "");
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

const sizeDigits = (value: number) => value.toFixed(value < 10 ? 1 : 0);

function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  let value = bytes / 1000;
  for (const unit of ["kB", "MB"] as const) {
    if (value < 1000) return `${sizeDigits(value)} ${unit}`;
    value /= 1000;
  }
  return `${sizeDigits(value)} GB`;
}

function mark(result: Result, format: Format, state: Step): Result {
  return {
    ...result,
    steps: result.steps.map((step) => (step.format === format ? { format, state } : step)),
  };
}

/** Replaces a file of the same name, so dropping an edited file again updates it. */
function upsert(list: readonly File[], file: File): File[] {
  return [...list.filter((item) => item.name !== file.name), file];
}

/** A data URL, which the site's image policy allows (it does not allow `blob:`). */
async function preview(file: File): Promise<string> {
  const svg = /\.svgz$/i.test(file.name)
    ? await new Response(file.stream().pipeThrough(new DecompressionStream("gzip"))).blob()
    : file;
  const bytes = new Uint8Array(await svg.arrayBuffer());
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

/**
 * The engine passes for the options: the formats that share a background, and the options for
 * them. The engine takes its options once, before the first SVG, so each background is its own
 * pass; the pool joins their archives into one.
 */
type Options = { formats: Format[]; passes: Pass[] } | { errors: string[] };

/** The options as picked; a new object whenever one of them changes. */
type Settings = {
  selected: ReadonlySet<Format>;
  backgrounds: Readonly<Record<Filled, Background>>;
  quality: string;
};

function readOptions({ selected, backgrounds, quality }: Settings): Options {
  const chosen = FORMATS.filter((format) => selected.has(format));
  const errors: string[] = [];
  if (chosen.includes("jpeg") && (quality === "" || Number(quality) < 1)) {
    errors.push("JPEG quality runs from 1% to 100%.");
  }
  if (chosen.length === 0) errors.push("Pick at least one format.");
  if (errors.length > 0) return { errors };
  // Formats grouped by their fill; SVG and PDF have none and join the first pass.
  const groups = new Map<string, Format[]>();
  for (const format of chosen) {
    if (!isFilled(format)) continue;
    const fill = fills[backgrounds[format]];
    groups.set(fill, [...(groups.get(fill) ?? []), format]);
  }
  const vector = chosen.filter((format) => !isFilled(format));
  const [firstFill, firstFormats] = [...groups][0] ?? ["", []];
  groups.set(firstFill, [...vector, ...firstFormats]);
  const passes = [...groups].map(([fill, group]) => ({
    formats: group,
    sizes: [...rasterSizes],
    background: fill,
    quality: quality || "100",
  }));
  return { formats: chosen, passes };
}

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") === true;

/** A whole number up to 100, or nothing while it is being typed. */
const cleanQuality = (text: string) => {
  const digits = text.replace(/\D/g, "").slice(0, 3);
  return digits === "" ? "" : String(Math.min(Number(digits), 100));
};

/** One conversion: the files, and the engine passes already read from the options. */
type Job = {
  files: readonly File[];
  fonts: readonly File[];
  passes: readonly Pass[];
  note: string;
};

/** Where a running conversion reports to. */
type Sink = {
  /** Whether this run is still the current one; a newer run or a clear silences it. */
  live: () => boolean;
  update: (index: number, change: (result: Result) => Result) => void;
  addFont: (font: Font) => void;
  setStatus: (status: Status) => void;
  setDownload: (download: Download) => void;
};

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Runs a job on the engine's workers and reports what they say; the pool joins the archives. An
 * SVG counts as converted when every pass converted it.
 */
async function run(pool: Pool, job: Job, sink: Sink): Promise<void> {
  const { files, note, passes } = job;
  const failures = new Set<string>();
  const converted = new Map<number, number>();
  const fail = (text: string) => sink.setStatus({ text, error: true });

  let inputs;
  try {
    inputs = await Promise.all([
      Promise.all(
        files.map(async (file) => ({ stem: stem(file.name), data: await file.arrayBuffer() })),
      ),
      Promise.all(
        job.fonts.map(async (file) => ({ name: file.name, data: await file.arrayBuffer() })),
      ),
    ]);
  } catch (error) {
    if (sink.live()) fail(`The files could not be read: ${reason(error)}`);
    return;
  }
  if (!sink.live()) return;
  const [svgs, fonts] = inputs;

  const outcome = await pool.convert({ svgs, fonts, passes: [...passes] }, (message) => {
    if (!sink.live()) return;
    switch (message.type) {
      case "font":
        sink.addFont({ text: message.families.join(", ") || message.name, error: false });
        return;
      case "font-error":
        failures.add(`${message.name}: ${message.message}`);
        sink.addFont({ text: `${message.name}: ${message.message}`, error: true });
        return;
      case "open": {
        const size = `${message.width} × ${message.height}`;
        sink.update(message.index, (result) => ({ ...result, size }));
        return;
      }
      case "step":
        sink.update(message.index, (result) => mark(result, message.format, "running"));
        return;
      case "stepped":
        sink.update(message.index, (result) => ({
          ...mark(result, message.format, "done"),
          files: [...result.files, ...message.files],
        }));
        return;
      case "converted":
        converted.set(message.index, (converted.get(message.index) ?? 0) + 1);
        return;
      case "failed": {
        const name = files[message.index]?.name ?? "An SVG";
        const text =
          message.code === noFonts
            ? `${name} has text but no fonts. Drop the .ttf, .otf or .ttc files it uses, or convert its text to outlines.`
            : message.message;
        failures.add(`${name}: ${text}`);
        sink.update(message.index, (result) => ({
          ...result,
          steps: result.steps.map(({ format }) => ({ format, state: "pending" as const })),
          files: [],
          error: text,
        }));
        return;
      }
    }
  });
  if (!sink.live()) return;

  switch (outcome.type) {
    case "done": {
      const { zip } = outcome;
      if (zip === null) {
        fail("Nothing was converted. The problems are listed below.");
        return;
      }
      const done = [...converted.values()].filter((times) => times === passes.length).length;
      const first = files[0];
      const name = files.length === 1 && first ? `${stem(first.name)}.zip` : "archetypon.zip";
      const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
      sink.setDownload({ url, name, bytes: zip.byteLength });
      const seconds = (outcome.ms / 1000).toFixed(1);
      const problems = failures.size === 0 ? "" : ` ${count(failures.size, "problem")} below.`;
      sink.setStatus({
        text: `Converted ${done} of ${count(files.length, "SVG")} in ${seconds} s.${problems}${note}`,
        error: failures.size > 0,
      });
      return;
    }
    case "failed":
      fail(`Conversion failed: ${outcome.message}`);
      return;
    case "crashed":
      fail(`The converter could not start: ${outcome.message}.`);
      return;
    case "cancelled":
      return;
  }
}

export function Converter({ wasm }: { wasm: string }) {
  const [svgs, setSvgs] = useState<File[]>([]);
  const [fonts, setFonts] = useState<File[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<Format>>(() => new Set(FORMATS));
  const [backgrounds, setBackgrounds] = useState(startBackgrounds);
  const [quality, setQuality] = useState("100");
  const [results, setResults] = useState<Result[]>([]);
  const [fontList, setFontList] = useState<Font[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [download, setDownload] = useState<Download | null>(null);
  const [dragging, setDragging] = useState(false);
  // One pool of warm workers per page, made on first use: the server render makes none.
  const pool = useRef<Pool | null>(null);
  const workers = useCallback(() => (pool.current ??= new Pool(engine, wasm)), [wasm]);
  const generation = useRef(0);
  const settings = useMemo<Settings>(
    () => ({ selected, backgrounds, quality }),
    [selected, backgrounds, quality],
  );
  // The settings of the last conversion: once they differ, the options have changed since.
  const [applied, setApplied] = useState(settings);

  // Load the engine once the page is idle, so the first file converts at once; stop the engine
  // when the page goes away. Free the ZIP when it changes.
  useEffect(() => {
    const cancel = workers().warmWhenIdle();
    return () => {
      cancel();
      pool.current?.dispose();
    };
  }, [workers]);
  useEffect(() => () => void (download && URL.revokeObjectURL(download.url)), [download]);

  const stop = useCallback(() => {
    generation.current += 1;
    pool.current?.cancel();
  }, []);

  const convert = useCallback(
    (files: readonly File[], fontFiles: readonly File[], note = "") => {
      if (files.length === 0) return;
      setApplied(settings);
      const options = readOptions(settings);
      if ("errors" in options) {
        setStatus({ text: options.errors.join(" "), error: true });
        return;
      }
      stop();
      setDownload(null);
      setFontList([]);
      setResults(
        files.map((file) => ({
          name: file.name,
          preview: null,
          size: null,
          steps: options.formats.map((format) => ({ format, state: "pending" as const })),
          files: [],
          error: null,
        })),
      );
      setStatus({ text: `Converting ${count(files.length, "SVG")}…${note}`, error: false });
      const update = (index: number, change: (result: Result) => Result) =>
        setResults((list) => list.map((result, at) => (at === index ? change(result) : result)));
      for (const [index, file] of files.entries()) {
        preview(file).then(
          (url) => update(index, (result) => ({ ...result, preview: url })),
          () => update(index, (result) => ({ ...result, preview: null })),
        );
      }

      const current = generation.current;
      void run(
        workers(),
        { files, fonts: fontFiles, passes: options.passes, note },
        {
          live: () => generation.current === current,
          update,
          addFont: (font) => setFontList((list) => [...list, font]),
          setStatus,
          setDownload,
        },
      );
    },
    [settings, stop, workers],
  );

  const add = useCallback(
    (dropped: readonly File[]) => {
      let nextSvgs = svgs;
      let nextFonts = fonts;
      const ignored: string[] = [];
      for (const file of dropped) {
        const type = kind(file.name);
        if (type === "svg") nextSvgs = upsert(nextSvgs, file);
        else if (type === "font") nextFonts = upsert(nextFonts, file);
        else ignored.push(file.name);
      }
      setSvgs(nextSvgs);
      setFonts(nextFonts);
      const skipped = ignored.length > 0 ? ` Skipped ${ignored.join(", ")}.` : "";
      if (nextSvgs.length > 0) convert(nextSvgs, nextFonts, skipped);
      else if (ignored.length > 0) {
        setStatus({
          text: `Skipped ${ignored.join(", ")}: only SVG, SVGZ, TTF, OTF and TTC files work.`,
          error: true,
        });
      } else if (nextFonts.length > 0) {
        setStatus({ text: `${count(nextFonts.length, "font")} ready. Add an SVG.`, error: false });
      }
    },
    [svgs, fonts, convert],
  );

  function clear() {
    stop();
    setSvgs([]);
    setFonts([]);
    setResults([]);
    setFontList([]);
    setDownload(null);
    setStatus(null);
  }

  // The whole page takes drops. Counting enters and leaves keeps child elements from
  // flickering the state as the pointer crosses them; the count outlives the listeners, which
  // change with the files.
  const dragDepth = useRef(0);
  useEffect(() => {
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      // Files are on their way: load the engine now if the page has not yet.
      workers().warm();
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    };
    const over = (event: DragEvent) => {
      if (!hasFiles(event) || !event.dataTransfer) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      setDragging(dragDepth.current > 0);
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event) || !event.dataTransfer) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      add([...event.dataTransfer.files]);
    };
    addEventListener("dragenter", enter);
    addEventListener("dragover", over);
    addEventListener("dragleave", leave);
    addEventListener("drop", drop);
    return () => {
      removeEventListener("dragenter", enter);
      removeEventListener("dragover", over);
      removeEventListener("dragleave", leave);
      removeEventListener("drop", drop);
    };
  }, [add, workers]);

  // Options apply as they change: the files convert again after a short pause in typing.
  useEffect(() => {
    if (applied === settings || svgs.length === 0) return undefined;
    const timer = setTimeout(() => convert(svgs, fonts), 400);
    return () => clearTimeout(timer);
  }, [applied, settings, svgs, fonts, convert]);

  /** Gives one format a state; the set keeps its identity when nothing changes. */
  const paint = useCallback((format: Format, on: boolean) => {
    setSelected((current) => {
      if (current.has(format) === on) return current;
      const next = new Set(current);
      if (on) next.add(format);
      else next.delete(format);
      return next;
    });
  }, []);

  const empty = svgs.length === 0 && fonts.length === 0;
  const picker = useRef<HTMLInputElement>(null);

  // Files chosen or dropped before the converter hydrated wait in its input (`client.ts`
  // `bridgeConverter`); the input's `data-live` tells that bridge to stand down from now on.
  useEffect(() => {
    const input = picker.current;
    if (!input) return;
    input.dataset.live = "";
    const early = [...(input.files ?? [])];
    if (early.length === 0) return;
    input.value = "";
    add(early);
  }, [add]);

  return (
    <div {...stylex.props(styles.tool)} onPointerEnter={() => workers().warm()}>
      <OptionsPanel
        selected={selected}
        backgrounds={backgrounds}
        quality={quality}
        onPaint={paint}
        onBackgroundChange={(format, value) =>
          setBackgrounds((current) => ({ ...current, [format]: value }))
        }
        onQualityChange={setQuality}
      />

      <div {...stylex.props(styles.actions)}>
        <button
          {...stylex.props(ui.reset, ui.quiet, ui.respond, ui.focusRing)}
          data-pick=""
          onClick={() => picker.current?.click()}
        >
          Choose files
        </button>
        {download && (
          <a
            {...stylex.props(ui.outbound, ui.respond, ui.focusRing, styles.download)}
            href={download.url}
            download={download.name}
          >
            Download {download.name} ({formatBytes(download.bytes)})
          </a>
        )}
        {!empty && (
          <button
            {...stylex.props(ui.reset, ui.quiet, ui.respond, ui.focusRing)}
            type="button"
            onClick={clear}
          >
            Clear
          </button>
        )}
      </div>
      <input
        ref={picker}
        {...stylex.props(ui.srOnly)}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        accept=".svg,.svgz,.ttf,.otf,.ttc,image/svg+xml"
        onChange={(event) => {
          const input = event.currentTarget;
          add([...(input.files ?? [])]);
          input.value = "";
        }}
      />

      {/* The page's opening says to drop files; while they hover over the page, this line says
          where they go. */}
      <p
        {...stylex.props(styles.status, (dragging || status?.error === true) && styles.problem)}
        role="status"
      >
        {dragging ? "Drop the files to add them." : (status?.text ?? "")}
      </p>

      {fontList.length > 0 && (
        <ul {...stylex.props(styles.list)} aria-label="Fonts">
          {fontList.map((font) => (
            <li {...stylex.props(styles.meta, font.error && styles.problem)}>{font.text}</li>
          ))}
        </ul>
      )}

      {results.length > 0 && <ResultList results={results} />}
    </div>
  );
}

type OptionsPanelProps = Settings & {
  onPaint: (format: Format, on: boolean) => void;
  onBackgroundChange: (format: Filled, background: Background) => void;
  onQualityChange: (quality: string) => void;
};

function OptionsPanel({
  selected,
  backgrounds,
  quality,
  onPaint,
  onBackgroundChange,
  onQualityChange,
}: OptionsPanelProps) {
  // Like selecting in Photos: press one toggle and drag across the others to give them all the
  // state the first one took.
  const painting = useRef<{ on: boolean } | null>(null);
  // A finger picks on release (click), so dragging across the table still scrolls the page.
  const tapping = useRef(false);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const stroke = painting.current;
      if (stroke === null) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const format = target?.closest<HTMLElement>("[data-toggle]")?.dataset.toggle;
      if (isFormat(format)) onPaint(format, stroke.on);
    };
    const end = () => (painting.current = null);
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
      removeEventListener("pointercancel", end);
    };
  }, [onPaint]);

  function toggle(format: Format, on: boolean) {
    return (
      <button
        {...stylex.props(
          ui.reset,
          ui.respond,
          ui.focusRing,
          styles.toggle,
          styles.formatName,
          on && styles.on,
        )}
        type="button"
        data-toggle={format}
        aria-pressed={on}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          tapping.current = event.pointerType === "touch";
          if (tapping.current) return;
          // No focus or text selection from a pointer; the press itself picks.
          event.preventDefault();
          painting.current = { on: !on };
          onPaint(format, !on);
        }}
        // Keyboard, or a finger: a mouse or pen already picked on press.
        onClick={(event) => {
          if (event.detail !== 0 && !tapping.current) return;
          tapping.current = false;
          onPaint(format, !on);
        }}
      >
        {labels[format]}
      </button>
    );
  }

  function typeQuality(event: TargetedEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const value = cleanQuality(input.value);
    // Write a refused character straight back out, so it never shows.
    if (input.value !== value) input.value = value;
    onQualityChange(value);
  }

  const empty = (
    <span {...stylex.props(styles.none)}>
      <span aria-hidden="true">—</span>
      <span {...stylex.props(ui.srOnly)}>None</span>
    </span>
  );

  // A table like the homepage's: one row per file type, its settings beside it. A cell that does
  // not apply to the format shows a dash. Each format has its own background; JPEG has no
  // transparency, so it is white or black.
  return (
    <div {...stylex.props(ui.text, styles.panel)} role="group" aria-label="Options">
      <div {...stylex.props(styles.options)}>
        <div {...stylex.props(ui.label, styles.row, styles.header)} aria-hidden="true">
          <span>Format</span>
          <span>Size</span>
          <span>Background</span>
          <span {...stylex.props(styles.end)}>Quality</span>
        </div>
        {FORMATS.map((format, index) => {
          const on = selected.has(format);
          return (
            <div
              key={format}
              {...stylex.props(styles.row, index > 0 && styles.divided, !on && styles.off)}
              role="group"
              aria-label={labels[format]}
            >
              {toggle(format, on)}
              <span>{sizeText[format]}</span>
              {!isFilled(format) ? (
                empty
              ) : (
                <button
                  {...stylex.props(ui.reset, ui.quiet, ui.respond, ui.focusRing, styles.setting)}
                  type="button"
                  aria-label={`${labels[format]} background: ${backgroundLabels[backgrounds[format]]}`}
                  onClick={() =>
                    onBackgroundChange(format, nextBackground(format, backgrounds[format]))
                  }
                >
                  {backgroundLabels[backgrounds[format]]}
                </button>
              )}
              {format === "jpeg" ? (
                <label {...stylex.props(styles.percent, styles.end)}>
                  <span {...stylex.props(styles.digits)}>
                    {/* The empty columns show dark grey zeros (010%, 000%); the typed digits'
                        columns stay blank here, covered by the field's own text. */}
                    <span {...stylex.props(ui.figures, styles.padding)} aria-hidden="true">
                      {"0".repeat(3 - quality.length)}
                      <span {...stylex.props(styles.typed)}>{quality}</span>
                    </span>
                    <input
                      {...stylex.props(ui.figures, styles.input)}
                      value={quality}
                      inputMode="numeric"
                      maxLength={3}
                      autoComplete="off"
                      spellcheck={false}
                      aria-label="JPEG quality, in percent, from 1 to 100"
                      onInput={typeQuality}
                      onBlur={() => (quality === "" || quality === "0") && onQualityChange("100")}
                    />
                  </span>
                  <span aria-hidden="true">%</span>
                </label>
              ) : (
                <span {...stylex.props(styles.end)}>{empty}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultList({ results }: { results: readonly Result[] }) {
  return (
    <ol {...stylex.props(styles.list)} aria-label="Results">
      {results.map((result, index) => (
        <li {...stylex.props(styles.result, index > 0 && styles.divided)}>
          {result.preview ? (
            <img
              {...stylex.props(ui.codeSurface, ui.edge, styles.preview)}
              src={result.preview}
              alt=""
              width={48}
              height={48}
            />
          ) : (
            <span {...stylex.props(ui.codeSurface, ui.edge, styles.preview)} />
          )}
          <div {...stylex.props(styles.body)}>
            <p {...stylex.props(styles.name)}>{result.name}</p>
            {result.size && <p {...stylex.props(styles.meta)}>{result.size}</p>}
            <ol {...stylex.props(styles.steps)} aria-label="Formats">
              {result.steps.map(({ format, state }) => (
                <li {...stylex.props(styles[state])}>
                  {labels[format]}
                  <span {...stylex.props(ui.srOnly)}>
                    {state === "done" ? ", done" : state === "running" ? ", running" : ""}
                  </span>
                </li>
              ))}
            </ol>
            {result.error && <p {...stylex.props(styles.meta, styles.problem)}>{result.error}</p>}
            {result.files.length > 0 && (
              <details {...stylex.props(styles.details)}>
                <summary {...stylex.props(ui.quiet, ui.respond, ui.focusRing, styles.summary)}>
                  {count(result.files.length, "file")},{" "}
                  {formatBytes(result.files.reduce((sum, file) => sum + file.size, 0))}
                </summary>
                <ul {...stylex.props(styles.files)}>
                  {result.files.map((file) => (
                    <li {...stylex.props(styles.file)}>
                      <span {...stylex.props(styles.path)}>{file.path}</span>
                      <span {...stylex.props(ui.figures)}>{formatBytes(file.size)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

const styles = stylex.create({
  tool: { display: "flex", flexDirection: "column", gap: space.sectionGap },
  panel: { display: "flex", flexDirection: "column", gap: space.sectionGap },
  /**
   * The project table's system (`portfolio.tsx`, `row.tsx`) on a settings table's columns
   * (`space.settingsColumns`): a label header over a hairline, then one row per format.
   */
  options: {
    display: "grid",
    gridTemplateColumns: space.settingsColumns,
    columnGap: { default: space.tableGap, [media.mobile]: space.mobileTableGap },
    // The header is a row padding short of a row (its line starts at the top), so the table ends
    // a row padding early; this gives it back and keeps what follows on the baseline grid.
    paddingBottom: { default: space.portfolioRowPadding, [media.mobile]: 0 },
  },
  /** A row on the table's columns and pitch, as the homepage's (`row.tsx`): a line and its padding. */
  row: {
    display: "grid",
    gridColumn: "1 / -1",
    gridTemplateColumns: "subgrid",
    // Centered, as the name is: it fills the row's height to be easy to hit.
    alignItems: "center",
    minHeight: {
      default: `calc(${space.linkLineHeight} + 2 * ${space.portfolioRowPadding})`,
      [media.mobile]: space.touchTarget,
    },
    color: colors.primary,
  },
  /** As the project table's header: labels (`ui.label`) on the text's line, a hairline under. */
  header: {
    alignItems: "baseline",
    minHeight: 0,
    paddingBlock: { default: `0 ${space.portfolioRowPadding}`, [media.mobile]: space.touchInset },
    boxShadow: `inset 0 -1px ${colors.hairline}`,
    // The row's own colour would override the label's.
    color: colors.quaternary,
  },
  /** A format that is off: its whole row and its dash go to the labels' dark brown. */
  off: { color: colors.quaternary },
  end: { justifySelf: "end" },
  /** A cell that does not apply to its format: a dark brown dash, nothing to fill in. */
  none: { color: colors.quaternary, userSelect: "none" },
  // White is picked, dark grey is not. Nothing else changes color, hover included, so the
  // color always means one thing.
  toggle: {
    color: colors.tertiary,
    // A finger scrolls the page across the table and picks on release.
    touchAction: "manipulation",
  },
  on: { color: colors.primary },
  /** The format's name, at the project names' weight: the row's switch, as tall as the row. */
  formatName: {
    alignSelf: "stretch",
    justifySelf: "start",
    display: "flex",
    alignItems: "center",
    fontWeight: typeScale.emphasisWeight,
  },
  /** A setting in a row, named by its value; quiet like the other interface links (`ui.quiet`). */
  setting: { justifySelf: "start" },
  percent: {
    display: "flex",
    alignItems: "baseline",
    color: "inherit",
  },
  /** The field over its zero padding; both are set in the same three tabular columns. */
  digits: { position: "relative", display: "inline-block" },
  padding: { color: colors.tertiary, whiteSpace: "pre" },
  typed: { visibility: "hidden" },
  /**
   * Always three tabular digits wide and set flush right, so the % never moves: 98 fills the
   * last two columns and the padding's zero the first.
   */
  input: {
    position: "absolute",
    inset: 0,
    appearance: "none",
    width: "100%",
    textAlign: "right",
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    color: colors.primary,
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "inherit",
    fontFeatureSettings: "inherit",
    // Typing shows the caret; the field draws no ring or border around itself.
    outline: "none",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    // The table's gap, as between the option labels and their values.
    columnGap: { default: space.tableGap, [media.mobile]: space.mobileTableGap },
    alignItems: "baseline",
  },
  /** Takes no room until it has something to say; it stays in the page so it is announced. */
  status: {
    margin: 0,
    marginTop: { default: 0, ":empty": `calc(${space.sectionGap} * -1)` },
    color: colors.primary,
    minHeight: { default: space.linkLineHeight, ":empty": 0 },
  },
  problem: { color: colors.primary },
  /** Set like the article links (`markdown.tsx`), with `ui.outbound`. */
  download: {
    width: "fit-content",
    color: { default: colors.primary, ":focus-visible": colors.primary },
  },
  list: { margin: 0, padding: 0, listStyle: "none" },
  /** Two units above and below; the preview is two lines tall, the name and its size beside it. */
  result: {
    display: "grid",
    gridTemplateColumns: `calc(2 * ${space.linkLineHeight}) minmax(0, 1fr)`,
    columnGap: space.tableGap,
    alignItems: "start",
    paddingBlock: `calc(2 * ${space.unit})`,
  },
  divided: { boxShadow: `inset 0 1px ${colors.hairline}` },
  /** On the code surface (`ui.codeSurface`, `ui.edge`), as code is. */
  preview: {
    display: "block",
    width: `calc(2 * ${space.linkLineHeight})`,
    height: `calc(2 * ${space.linkLineHeight})`,
    objectFit: "contain",
  },
  body: { minWidth: 0 },
  name: { margin: 0, color: colors.primary, overflowWrap: "anywhere" },
  meta: { margin: 0, color: colors.primary },
  steps: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space.tableGap,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  // The converter's one local state scale, between the ladder's rungs: waiting tertiary, work
  // in progress secondary, finished primary.
  pending: { color: colors.tertiary },
  running: { color: colors.secondary },
  done: { color: colors.primary },
  details: { marginTop: `calc(${space.unit} / 2)` },
  summary: {
    cursor: "pointer",
    listStyle: "none",
    "::-webkit-details-marker": { display: "none" },
  },
  files: {
    margin: `${space.unit} 0 0`,
    padding: 0,
    listStyle: "none",
    fontSize: typeScale.labelSize,
    lineHeight: space.linkLineHeight,
    letterSpacing: typeScale.labelTracking,
  },
  file: {
    display: "flex",
    justifyContent: "space-between",
    columnGap: space.tableGap,
    color: colors.primary,
  },
  path: { minWidth: 0, overflowWrap: "anywhere" },
});
