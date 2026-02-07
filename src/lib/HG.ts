import { CB_TYPE, ERROR } from './HGAPI';
import { TYPE } from './llhttp/constants';
import ffi from 'tjs:ffi';

type hg_state_t = number;
type llhttp_ext = number;
type llhttp_t = number;
type bufferPtr = number;

interface HGExports {
  hg_get_prt_size: () => number;
  hg_get_last_cb: (state: llhttp_ext) => number;
  hg_get_serial: (state: llhttp_ext) => number;
  hg_get_last_size: (state: llhttp_ext) => number;
  hg_get_last_pos: (state: llhttp_ext) => number;
  hg_get_last_error: (state: llhttp_ext) => number;
  hg_create: (type: TYPE) => llhttp_ext;
  hg_destroy: (parser: llhttp_t) => void;
  hg_print_error_reason: (parser: llhttp_t) => void;
  hg_begin: (parser: llhttp_ext, data: bufferPtr, size: number) => hg_state_t;
  hg_next: (parser: llhttp_ext) => llhttp_ext;
  hg_malloc: (size: number) => bufferPtr;
  hg_free: (buffer: bufferPtr) => void;
  hg_write: (
    buffer: bufferPtr,
    size: number,
    w01?: number,
    w02?: number,
    w03?: number,
    w04?: number,
    w05?: number,
    w06?: number,
    w07?: number,
    w08?: number,
    w09?: number,
    w10?: number,
    w11?: number,
    w12?: number,
    w13?: number,
    w14?: number,
    w15?: number,
    w16?: number,
  ) => void;
  hg_dump: (buffer: bufferPtr) => void;
  [key: string]: any;
}

interface HGInstance extends WebAssembly.Instance {
  exports: HGExports;
}

export class HTTPProtocolIterator {
  static #finalize = ([hg_buffer, hg_parser]: [number, number]) => {
    HTTPProtocolIterator.#inst.exports.hg_destroy(hg_parser);
    HTTPProtocolIterator.#inst.exports.hg_free(hg_buffer);
  };
  static #registry = new FinalizationRegistry(this.#finalize);
  static #inst: HGInstance;
  #hg_parser: number;

  public static readonly TRANSFER_BUFFER_SIZE = 16 * 4;

  public buffer: Uint8Array;
  private _lastTransferEnd: number;
  public get lastTransferEnd(): number {
    return this._lastTransferEnd;
  }
  #hg_buffer: number;
  #hg_writeArgs = new Uint32Array(16 + 2);
  #hg_writeArgsBytes = new Uint8Array(this.#hg_writeArgs.buffer, 8);

  public constructor(
    public readonly maxLen: number,
    public readonly llhttpModule: WebAssembly.Module,
    public readonly options: { generateCompleteOnly: boolean } = { generateCompleteOnly: true },
  ) {
    HTTPProtocolIterator.#inst ??= new WebAssembly.Instance(llhttpModule) as HGInstance;

    if (!(this.#hg_buffer = HTTPProtocolIterator.#inst.exports.hg_malloc(maxLen)))
      throw new Error('Failed to allocate buffer');

    if (!(this.#hg_parser = HTTPProtocolIterator.#inst.exports.hg_create(TYPE.REQUEST)))
      throw new Error('Failed to create llhttp parser');

    this.buffer = new Uint8Array(maxLen);

    HTTPProtocolIterator.#registry.register(this, [this.#hg_buffer, this.#hg_parser], this);
  }

  #readStr = (pos: number, size: number): string => {
    if (!size) return '';
    return ffi.bufferToString(this.buffer.subarray(pos, pos + size));
  };

  public DUMP = () => {
    HTTPProtocolIterator.#inst.exports.hg_dump(this.#hg_buffer);
  }

  public get state() {
    const callback_id = HTTPProtocolIterator.#inst.exports.hg_get_last_cb(this.#hg_parser);
    const callback = CB_TYPE[callback_id];
    const serial = HTTPProtocolIterator.#inst.exports.hg_get_serial(this.#hg_parser);
    const error = HTTPProtocolIterator.#inst.exports.hg_get_last_error(this.#hg_parser);
    const pos = HTTPProtocolIterator.#inst.exports.hg_get_last_pos(this.#hg_parser);
    const size = HTTPProtocolIterator.#inst.exports.hg_get_last_size(this.#hg_parser);

    return {
      callback,
      callback_id,
      error,
      pos,
      size,
      value: this.#readStr(pos, size),
      serial,
      append: (bufferChunk: Uint8Array) => {
        this.#transfer(bufferChunk, this._lastTransferEnd);
      },
    };
  }

  #pullToComplete = (state: this['state']) => {
    let lastSerial = -1;
    while (!state.callback.endsWith('_complete') && state.serial !== lastSerial) {
      lastSerial = state.serial;
      HTTPProtocolIterator.#inst.exports.hg_next(this.#hg_parser);
      state = this.state;
    }

    return state;
  };

  public *begin(bufferChunk: Uint8Array) {
    this.#transfer(bufferChunk);

    HTTPProtocolIterator.#inst.exports.hg_begin(this.#hg_parser, this.#hg_buffer, bufferChunk.byteLength);

    let state = this.state;
    while (state.callback !== CB_TYPE[CB_TYPE.on_message_complete] && state.error === ERROR.HPE_PAUSED) {
      if (this.options.generateCompleteOnly) state = this.#pullToComplete(state); // advance to the next complete chunk
      yield state;

      HTTPProtocolIterator.#inst.exports.hg_next(this.#hg_parser);
      state = this.state;
    }

    return state;
  }

  #transfer = (bufferChunk: Uint8Array, offset: number = 0) => {
    this.buffer.set(bufferChunk, offset);
    const dangligBytes = bufferChunk.byteLength % HTTPProtocolIterator.TRANSFER_BUFFER_SIZE;
    const fullTransferCount = (bufferChunk.byteLength - dangligBytes) / HTTPProtocolIterator.TRANSFER_BUFFER_SIZE;

    for (let i = 0; i < fullTransferCount; i++) {
      this.#hg_writeArgsBytes.set(
        bufferChunk.subarray(
          i * HTTPProtocolIterator.TRANSFER_BUFFER_SIZE,
          (i + 1) * HTTPProtocolIterator.TRANSFER_BUFFER_SIZE,
        ),
      );
      this.#hg_writeArgs[0] = this.#hg_buffer + offset + i * HTTPProtocolIterator.TRANSFER_BUFFER_SIZE;
      this.#hg_writeArgs[1] = HTTPProtocolIterator.TRANSFER_BUFFER_SIZE;
      HTTPProtocolIterator.#inst.exports.hg_write.apply(undefined, this.#hg_writeArgs);
    }

    this.#hg_writeArgs.fill(0); // reset args
    this.#hg_writeArgs[0] = this.#hg_buffer + offset + fullTransferCount * HTTPProtocolIterator.TRANSFER_BUFFER_SIZE;
    this.#hg_writeArgs[1] = dangligBytes;
    this.#hg_writeArgsBytes.set(bufferChunk.subarray(fullTransferCount * HTTPProtocolIterator.TRANSFER_BUFFER_SIZE));
    HTTPProtocolIterator.#inst.exports.hg_write.apply(undefined, this.#hg_writeArgs);

    this._lastTransferEnd = offset + fullTransferCount * HTTPProtocolIterator.TRANSFER_BUFFER_SIZE + dangligBytes;
  };
}
