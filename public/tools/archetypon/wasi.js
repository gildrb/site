// web/src/wasi.ts
var SUCCESS = 0;
var EBADF = 8;
var EINVAL = 28;
var ENOSYS = 52;
var REALTIME = 0;
var MONOTONIC = 1;
var STDOUT = 1;
var STDERR = 2;
var UNSUPPORTED = [
	"fd_close",
	"fd_fdstat_get",
	"fd_filestat_get",
	"fd_prestat_dir_name",
	"fd_read",
	"path_filestat_get",
	"path_open"
];
var WasiExit = class extends Error {
	code;
	constructor(code) {
		super(`exited with code ${code}`);
		this.code = code;
	}
};
var Wasi = class {
	#memory = null;
	#decoders = [new TextDecoder(), new TextDecoder()];
	#pending = ["", ""];
	bind(memory) {
		this.#memory = memory;
	}
	imports() {
		const calls = {
			clock_time_get: this.#clockTimeGet.bind(this),
			environ_get: () => SUCCESS,
			environ_sizes_get: this.#environSizesGet.bind(this),
			fd_prestat_get: () => EBADF,
			fd_write: this.#fdWrite.bind(this),
			proc_exit: (code) => {
				throw new WasiExit(code);
			},
			random_get: this.#randomGet.bind(this),
			sched_yield: () => SUCCESS
		};
		for (const name of UNSUPPORTED) calls[name] = () => ENOSYS;
		return { wasi_snapshot_preview1: calls };
	}
	#buffer() {
		if (this.#memory === null) throw new Error("WASI memory is not bound");
		return this.#memory.buffer;
	}
	#view() {
		return new DataView(this.#buffer());
	}
	#bytes(ptr, len) {
		return new Uint8Array(this.#buffer(), ptr >>> 0, len >>> 0);
	}
	#clockTimeGet(id, _precision, time) {
		let nanos;
		if (id === REALTIME) nanos = BigInt(Date.now()) * 1000000n;
		else if (id === MONOTONIC) nanos = BigInt(Math.round(performance.now() * 1e6));
		else return EINVAL;
		this.#view().setBigUint64(time, nanos, true);
		return SUCCESS;
	}
	#environSizesGet(count, size) {
		const view = this.#view();
		view.setUint32(count, 0, true);
		view.setUint32(size, 0, true);
		return SUCCESS;
	}
	#fdWrite(fd, iovs, count, written) {
		if (fd !== STDOUT && fd !== STDERR) return EBADF;
		const view = this.#view();
		let total = 0;
		for (let i = 0; i < count; i += 1) {
			const ptr = view.getUint32(iovs + i * 8, true);
			const len = view.getUint32(iovs + i * 8 + 4, true);
			this.#print(fd, this.#bytes(ptr, len));
			total += len;
		}
		view.setUint32(written, total, true);
		return SUCCESS;
	}
	#print(fd, bytes) {
		const index = fd === STDOUT ? 0 : 1;
		const text = this.#decoders[index].decode(bytes, { stream: true });
		const lines = (this.#pending[index] + text).split("\n");
		this.#pending[index] = lines.pop() ?? "";
		const log = fd === STDOUT ? console.log : console.error;
		for (const line of lines) log(line);
	}
	#randomGet(ptr, len) {
		const chunk = 65536;
		for (let done = 0; done < len; done += chunk) {
			const size = Math.min(chunk, len - done);
			crypto.getRandomValues(this.#bytes(ptr + done, size));
		}
		return SUCCESS;
	}
};
export { Wasi, WasiExit };
