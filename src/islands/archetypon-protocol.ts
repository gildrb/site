// Copied from archetypon web/src/protocol.ts (the engine repo); change it there first,
// then copy it here again.
// The messages between a page and worker.js: the engine to run, then one
// conversion at a time, each answered by a stream of replies.

export const FORMATS = ["svg", "pdf", "png", "webp", "jpeg", "ico"] as const;
export type Format = (typeof FORMATS)[number];

/** An SVG or SVGZ to convert; `stem` names its outputs in the ZIP. */
export type SvgInput = { stem: string; data: ArrayBuffer };
/** A TTF, OTF, or TTC file to set text in. */
export type FontInput = { name: string; data: ArrayBuffer };

/**
 * One conversion. `options` is the engine's configuration text, one
 * `key=value` per line (`sizes`, `background`, `jpeg-quality`). `stamp` is
 * the MS-DOS date (high half) and time (low half) every file in the ZIP
 * carries, so that conversions split across workers make the same archive.
 */
export type Request = {
  svgs: SvgInput[];
  fonts: FontInput[];
  formats: Format[];
  options: string;
  stamp: number;
};

/**
 * What a page sends a worker. `load` names the engine: the URL of
 * archetypon.wasm, which the worker compiles and sends back (`loaded`) for
 * the page to hand to its other workers, or that compiled module. With
 * `warm`, a worker that compiles it then runs it once on a sample, so the
 * browser optimizes it before the first file. A conversion sent before the
 * engine waits for it.
 */
export type Command =
  | { type: "load"; wasm: string | WebAssembly.Module; warm: boolean }
  | { type: "convert"; request: Request };

/** A file the engine added to the ZIP. */
export type Output = { path: string; size: number };

export type Reply =
  | { type: "loaded"; module: WebAssembly.Module }
  | { type: "font"; name: string; families: string[] }
  | { type: "font-error"; name: string; message: string }
  | { type: "open"; index: number; width: number; height: number }
  | { type: "step"; index: number; format: Format }
  | { type: "stepped"; index: number; format: Format; files: Output[] }
  | { type: "converted"; index: number }
  | { type: "failed"; index: number; code: number; message: string }
  | { type: "done"; zip: ArrayBuffer | null; ms: number }
  | { type: "error"; message: string };

function fields(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return Object.fromEntries(Object.entries(value));
}

export function isFormat(value: unknown): value is Format {
  return FORMATS.some((format) => format === value);
}

function isIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function output(value: unknown): Output | null {
  const data = fields(value);
  if (data === null) {
    return null;
  }
  const { path, size } = data;
  return typeof path === "string" && typeof size === "number" ? { path, size } : null;
}

function list<T>(value: unknown, item: (value: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: T[] = [];
  for (const entry of value) {
    const decoded = item(entry);
    if (decoded === null) {
      return null;
    }
    items.push(decoded);
  }
  return items;
}

function svgInput(value: unknown): SvgInput | null {
  const data = fields(value);
  if (data === null) {
    return null;
  }
  const { stem, data: bytes } = data;
  return typeof stem === "string" && bytes instanceof ArrayBuffer ? { stem, data: bytes } : null;
}

function fontInput(value: unknown): FontInput | null {
  const data = fields(value);
  if (data === null) {
    return null;
  }
  const { name, data: bytes } = data;
  return typeof name === "string" && bytes instanceof ArrayBuffer ? { name, data: bytes } : null;
}

function decodeRequest(value: unknown): Request | null {
  const data = fields(value);
  if (data === null) {
    return null;
  }
  const svgs = list(data["svgs"], svgInput);
  const fonts = list(data["fonts"], fontInput);
  const { formats, options, stamp } = data;
  if (
    svgs === null ||
    fonts === null ||
    !Array.isArray(formats) ||
    !formats.every(isFormat) ||
    typeof options !== "string" ||
    typeof stamp !== "number" ||
    !Number.isInteger(stamp)
  ) {
    return null;
  }
  return { svgs, fonts, formats, options, stamp };
}

/** Checks a message sent to the worker against `Command`. */
export function decodeCommand(value: unknown): Command | null {
  const data = fields(value);
  if (data === null) {
    return null;
  }
  switch (data["type"]) {
    case "load": {
      const { wasm, warm } = data;
      return (typeof wasm === "string" || wasm instanceof WebAssembly.Module) &&
        typeof warm === "boolean"
        ? { type: "load", wasm, warm }
        : null;
    }
    case "convert": {
      const request = decodeRequest(data["request"]);
      return request === null ? null : { type: "convert", request };
    }
    default:
      return null;
  }
}

/** Checks a message from the worker against `Reply`. */
export function decodeReply(value: unknown): Reply | null {
  const data = fields(value);
  if (data === null) {
    return null;
  }
  const { type, index, name, message, format } = data;
  switch (type) {
    case "loaded": {
      const { module } = data;
      return module instanceof WebAssembly.Module ? { type, module } : null;
    }
    case "font": {
      const { families } = data;
      return typeof name === "string" && isStrings(families) ? { type, name, families } : null;
    }
    case "font-error":
      return typeof name === "string" && typeof message === "string"
        ? { type, name, message }
        : null;
    case "open": {
      const { width, height } = data;
      return isIndex(index) && typeof width === "number" && typeof height === "number"
        ? { type, index, width, height }
        : null;
    }
    case "step":
      return isIndex(index) && isFormat(format) ? { type, index, format } : null;
    case "stepped": {
      const files = list(data["files"], output);
      return isIndex(index) && isFormat(format) && files !== null
        ? { type, index, format, files }
        : null;
    }
    case "converted":
      return isIndex(index) ? { type, index } : null;
    case "failed": {
      const { code } = data;
      return isIndex(index) && typeof code === "number" && typeof message === "string"
        ? { type, index, code, message }
        : null;
    }
    case "done": {
      const { zip, ms } = data;
      return (zip === null || zip instanceof ArrayBuffer) && typeof ms === "number"
        ? { type, zip, ms }
        : null;
    }
    case "error":
      return typeof message === "string" ? { type, message } : null;
    default:
      return null;
  }
}
