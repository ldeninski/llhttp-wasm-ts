import type { parse } from 'tjs:uuid';
import type { TYPE } from './llhttp/constants';

export enum CB_TYPE {
  CB_TYPE_on_chunk_complete = 1,
  CB_TYPE_on_chunk_extension_name_complete = 2,
  CB_TYPE_on_chunk_extension_value_complete = 3,
  CB_TYPE_on_chunk_header = 4,
  CB_TYPE_on_header_field_complete = 5,
  CB_TYPE_on_header_value_complete = 6,
  CB_TYPE_on_headers_complete = 7,
  CB_TYPE_on_message_begin = 8,
  CB_TYPE_on_message_complete = 9,
  CB_TYPE_on_method_complete = 10,
  CB_TYPE_on_protocol_complete = 11,
  CB_TYPE_on_reset = 12,
  CB_TYPE_on_status_complete = 13,
  CB_TYPE_on_url_complete = 14,
  CB_TYPE_on_version_complete = 15,
  CB_TYPE_on_body = 16,
  CB_TYPE_on_chunk_extension_name = 17,
  CB_TYPE_on_chunk_extension_value = 18,
  CB_TYPE_on_header_field = 19,
  CB_TYPE_on_header_value = 20,
  CB_TYPE_on_method = 21,
  CB_TYPE_on_protocol = 22,
  CB_TYPE_on_status = 23,
  CB_TYPE_on_url = 24,
  CB_TYPE_on_version = 25,
}

type hg_state_t = number;
type llhttp_ext = number;
type llhttp_t = number;
type bufferPtr = number;

export interface HGState {
  last_cb: CB_TYPE;
  last_cb_name: string;
  last_pos: number;
  last_size: number;
  last_error: number;
}

export interface HGAPI {
  hg_get_prt_size: () => number;
  hg_get_last_cb: (state: llhttp_ext) => number;
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
}

const TRANSFER_BUFFER_SIZE = 16 * 4;

export const transferBuffer = (bytes: Uint8Array, api: HGAPI): bufferPtr => {
  let buffer: bufferPtr;
  try {
    buffer = api.hg_malloc(bytes.byteLength);
    if (!buffer) throw new Error('Failed to allocate buffer');

    const argsBuffer = new Uint32Array(16 + 2);
    const argsWriteArray = new Uint8Array(argsBuffer.buffer, 8); // leave 2 words for the buffer and size args

    const dangligBytes = bytes.byteLength % TRANSFER_BUFFER_SIZE;
    const fullTransferCount = (bytes.byteLength - dangligBytes) / TRANSFER_BUFFER_SIZE;

    for (let i = 0; i < fullTransferCount; i++) {
      argsWriteArray.set(bytes.subarray(i * TRANSFER_BUFFER_SIZE, (i + 1) * TRANSFER_BUFFER_SIZE));
      argsBuffer[0] = buffer + i * TRANSFER_BUFFER_SIZE;
      argsBuffer[1] = TRANSFER_BUFFER_SIZE;
      api.hg_write.apply(undefined, argsBuffer);
    }

    argsBuffer.fill(0);
    argsBuffer[0] = buffer + fullTransferCount * TRANSFER_BUFFER_SIZE;
    argsBuffer[1] = dangligBytes;
    argsWriteArray.set(bytes.subarray(fullTransferCount * TRANSFER_BUFFER_SIZE));
    api.hg_write.apply(undefined, argsBuffer);

    return buffer;
  } catch (e) {
    api.hg_free(buffer);
    throw e;
  }
};

export const hgGetState = (parser: llhttp_ext, api: HGAPI): HGState => {
  const last_cb = api.hg_get_last_cb(parser);
  return {
    last_error: api.hg_get_last_error(parser),
    last_cb_name: CB_TYPE[last_cb],
    last_cb,
    last_pos: api.hg_get_last_pos(parser),
    last_size: api.hg_get_last_size(parser),
  };
};
