import type { parse } from 'tjs:uuid';
import type { TYPE } from './llhttp/constants';

export enum CB_TYPE {
  on_chunk_complete = 1,
  on_chunk_extension_name_complete = 2,
  on_chunk_extension_value_complete = 3,
  on_chunk_header = 4,
  on_header_field_complete = 5,
  on_header_value_complete = 6,
  on_headers_complete = 7,
  on_message_begin = 8,
  on_message_complete = 9,
  on_method_complete = 10,
  on_protocol_complete = 11,
  on_reset = 12,
  on_status_complete = 13,
  on_url_complete = 14,
  on_version_complete = 15,
  on_body = 16,
  on_chunk_extension_name = 17,
  on_chunk_extension_value = 18,
  on_header_field = 19,
  on_header_value = 20,
  on_method = 21,
  on_protocol = 22,
  on_status = 23,
  on_url = 24,
  on_version = 25,
}

export enum ERROR {
  HPE_OK = 0,
  HPE_INTERNAL = 1,
  HPE_STRICT = 2,
  HPE_CR_EXPECTED = 25,
  HPE_LF_EXPECTED = 3,
  HPE_UNEXPECTED_CONTENT_LENGTH = 4,
  HPE_UNEXPECTED_SPACE = 30,
  HPE_CLOSED_CONNECTION = 5,
  HPE_INVALID_METHOD = 6,
  HPE_INVALID_URL = 7,
  HPE_INVALID_CONSTANT = 8,
  HPE_INVALID_VERSION = 9,
  HPE_INVALID_HEADER_TOKEN = 10,
  HPE_INVALID_CONTENT_LENGTH = 11,
  HPE_INVALID_CHUNK_SIZE = 12,
  HPE_INVALID_STATUS = 13,
  HPE_INVALID_EOF_STATE = 14,
  HPE_INVALID_TRANSFER_ENCODING = 15,
  HPE_CB_MESSAGE_BEGIN = 16,
  HPE_CB_HEADERS_COMPLETE = 17,
  HPE_CB_MESSAGE_COMPLETE = 18,
  HPE_CB_CHUNK_HEADER = 19,
  HPE_CB_CHUNK_COMPLETE = 20,
  HPE_PAUSED = 21,
  HPE_PAUSED_UPGRADE = 22,
  HPE_PAUSED_H2_UPGRADE = 23,
  HPE_USER = 24,
  HPE_CB_URL_COMPLETE = 26,
  HPE_CB_STATUS_COMPLETE = 27,
  HPE_CB_METHOD_COMPLETE = 32,
  HPE_CB_VERSION_COMPLETE = 33,
  HPE_CB_HEADER_FIELD_COMPLETE = 28,
  HPE_CB_HEADER_VALUE_COMPLETE = 29,
  HPE_CB_CHUNK_EXTENSION_NAME_COMPLETE = 34,
  HPE_CB_CHUNK_EXTENSION_VALUE_COMPLETE = 35,
  HPE_CB_RESET = 31,
  HPE_CB_PROTOCOL_COMPLETE = 38
};

export const CB_COMPLETE_MAX = CB_TYPE.on_version_complete;

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
