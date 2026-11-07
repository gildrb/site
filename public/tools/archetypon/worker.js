import { Wasi } from "./wasi.js";
// web/src/protocol.ts
var FORMATS = [
	"svg",
	"pdf",
	"png",
	"webp",
	"jpeg",
	"ico"
];
function fields(value) {
	if (typeof value !== "object" || value === null) return null;
	return Object.fromEntries(Object.entries(value));
}
function isFormat(value) {
	return FORMATS.some((format) => format === value);
}
function list(value, item) {
	if (!Array.isArray(value)) return null;
	const items = [];
	for (const entry of value) {
		const decoded = item(entry);
		if (decoded === null) return null;
		items.push(decoded);
	}
	return items;
}
function svgInput(value) {
	const data = fields(value);
	if (data === null) return null;
	const { stem, data: bytes } = data;
	return typeof stem === "string" && bytes instanceof ArrayBuffer ? {
		stem,
		data: bytes
	} : null;
}
function fontInput(value) {
	const data = fields(value);
	if (data === null) return null;
	const { name, data: bytes } = data;
	return typeof name === "string" && bytes instanceof ArrayBuffer ? {
		name,
		data: bytes
	} : null;
}
function decodeRequest(value) {
	const data = fields(value);
	if (data === null) return null;
	const svgs = list(data["svgs"], svgInput);
	const fonts = list(data["fonts"], fontInput);
	const { formats, options, stamp } = data;
	if (svgs === null || fonts === null || !Array.isArray(formats) || !formats.every(isFormat) || typeof options !== "string" || typeof stamp !== "number" || !Number.isInteger(stamp)) return null;
	return {
		svgs,
		fonts,
		formats,
		options,
		stamp
	};
}
/** Checks a message sent to the worker against `Command`. */
function decodeCommand(value) {
	const data = fields(value);
	if (data === null) return null;
	switch (data["type"]) {
		case "load": {
			const { wasm, warm } = data;
			return (typeof wasm === "string" || wasm instanceof WebAssembly.Module) && typeof warm === "boolean" ? {
				type: "load",
				wasm,
				warm
			} : null;
		}
		case "convert": {
			const request = decodeRequest(data["request"]);
			return request === null ? null : {
				type: "convert",
				request
			};
		}
		default: return null;
	}
}
// web/src/worker.ts
var compiled = Promise.withResolvers();
var loading = false;
/** Whether a conversion has arrived; then no sample is needed to warm up. */
var converting = false;
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var OK = 0;
var Failure = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
function fn(exports, name) {
	const value = exports[name];
	if (typeof value !== "function") throw new Error(`archetypon.wasm lacks ${name}`);
	return (...args) => Number(value(...args));
}
function bindExports(exports) {
	const memory = exports["memory"];
	if (!(memory instanceof WebAssembly.Memory)) throw new Error("archetypon.wasm lacks memory");
	const calls = {
		start: fn(exports, "start"),
		font: fn(exports, "font"),
		configure: fn(exports, "configure"),
		begin: fn(exports, "begin"),
		step: fn(exports, "step"),
		finish: fn(exports, "finish")
	};
	return {
		memory,
		initialize: fn(exports, "_initialize"),
		outputPtr: fn(exports, "output_ptr"),
		outputLen: fn(exports, "output_len"),
		input: fn(exports, "input"),
		calls
	};
}
var Engine = class Engine {
	static async create() {
		const wasi = new Wasi();
		const exports = bindExports((await WebAssembly.instantiate(await compiled.promise, wasi.imports())).exports);
		wasi.bind(exports.memory);
		exports.initialize();
		return new Engine(exports);
	}
	exports;
	constructor(exports) {
		this.exports = exports;
	}
	output() {
		const ptr = this.exports.outputPtr() >>> 0;
		const len = this.exports.outputLen() >>> 0;
		return new Uint8Array(this.exports.memory.buffer, ptr, len);
	}
	text() {
		return decoder.decode(this.output());
	}
	lines() {
		return this.text().split("\n").filter(Boolean);
	}
	input(bytes) {
		const ptr = this.exports.input(bytes.length) >>> 0;
		if (ptr === 0) throw new Failure(1, this.text());
		new Uint8Array(this.exports.memory.buffer, ptr, bytes.length).set(bytes);
	}
	call(name, ...args) {
		const code = this.exports.calls[name](...args);
		if (code !== OK) throw new Failure(code, this.text());
	}
};
function post(reply, transfer = []) {
	postMessage(reply, { transfer });
}
function entry(line) {
	const [path = "", size] = line.split("	");
	return {
		path,
		size: Number(size)
	};
}
function concat(first, second) {
	const bytes = new Uint8Array(first.length + second.length);
	bytes.set(first);
	bytes.set(second, first.length);
	return bytes;
}
async function run(request) {
	const { svgs, fonts, formats, options, stamp } = request;
	const started = performance.now();
	const engine = await Engine.create();
	engine.call("start", stamp);
	for (const font of fonts) try {
		engine.input(new Uint8Array(font.data));
		engine.call("font");
		const families = [...new Set(engine.lines())];
		const name = font.name;
		post({
			type: "font",
			name,
			families
		});
	} catch (error) {
		if (!(error instanceof Failure)) throw error;
		post({
			type: "font-error",
			name: font.name,
			message: error.message
		});
	}
	engine.input(encoder.encode(options));
	engine.call("configure");
	let converted = 0;
	for (const [index, svg] of svgs.entries()) try {
		const stem = encoder.encode(svg.stem);
		engine.input(concat(stem, new Uint8Array(svg.data)));
		engine.call("begin", stem.length);
		const [width = NaN, height = NaN] = engine.text().split(" ").map(Number);
		post({
			type: "open",
			index,
			width,
			height
		});
		for (const format of formats) {
			post({
				type: "step",
				index,
				format
			});
			engine.input(encoder.encode(format));
			engine.call("step");
			post({
				type: "stepped",
				index,
				format,
				files: engine.lines().map(entry)
			});
		}
		converted += 1;
		post({
			type: "converted",
			index
		});
	} catch (error) {
		if (!(error instanceof Failure)) throw error;
		post({
			type: "failed",
			index,
			code: error.code,
			message: error.message
		});
	}
	if (converted === 0) {
		post({
			type: "done",
			zip: null,
			ms: 0
		});
		return;
	}
	engine.call("finish");
	const zip = engine.output().slice().buffer;
	post({
		type: "done",
		zip,
		ms: performance.now() - started
	}, [zip]);
}
/** A small drawing with the features most SVGs use: paths, a gradient, a stroke. */
var SAMPLE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"g\"><stop offset=\"0\" stop-color=\"#e44\"/><stop offset=\"1\" stop-color=\"#48e\" stop-opacity=\".6\"/></linearGradient></defs><rect width=\"64\" height=\"48\" rx=\"6\" fill=\"url(#g)\"/><path d=\"M8 40C20 4 44 4 56 40Z\" fill=\"#fc3\" stroke=\"#222\" stroke-width=\"2\"/><circle cx=\"32\" cy=\"24\" r=\"9\" fill=\"none\" stroke=\"#fff\" stroke-width=\"3\"/></svg>";
/**
* Runs every format once on `SAMPLE`, out of sight. The browser starts
* WebAssembly in quick, slow code and optimizes the functions that run
* most; this makes it do so before the first real file, for every worker
* sharing the module, instead of during it.
*/
async function warmUp() {
	const engine = await Engine.create();
	engine.call("start", 2162688);
	engine.input(encoder.encode("sizes=48,1024\nbackground=\njpeg-quality=90\n"));
	engine.call("configure");
	const stem = encoder.encode("sample");
	engine.input(concat(stem, encoder.encode(SAMPLE)));
	engine.call("begin", stem.length);
	for (const format of FORMATS) {
		engine.input(encoder.encode(format));
		engine.call("step");
	}
}
function fault(error) {
	post({
		type: "error",
		message: error instanceof Failure ? error.message : `the converter stopped unexpectedly (${error instanceof Error ? error.message : String(error)})`
	});
}
function load(wasm, warm) {
	if (loading) return;
	loading = true;
	if (typeof wasm !== "string") {
		compiled.resolve(wasm);
		return;
	}
	WebAssembly.compileStreaming(fetch(wasm)).then((module) => {
		compiled.resolve(module);
		post({
			type: "loaded",
			module
		});
		if (warm && !converting) warmUp().catch(() => void 0);
	}, (error) => {
		const message = `${wasm} did not load (${error instanceof Error ? error.message : String(error)})`;
		compiled.reject(new Failure(1, message));
		post({
			type: "error",
			message
		});
	});
}
addEventListener("message", ({ data }) => {
	const command = decodeCommand(data);
	if (command === null) {
		fault(/* @__PURE__ */ new Error("malformed request"));
		return;
	}
	switch (command.type) {
		case "load":
			load(command.wasm, command.warm);
			return;
		case "convert":
			converting = true;
			run(command.request).catch(fault);
			return;
	}
});
