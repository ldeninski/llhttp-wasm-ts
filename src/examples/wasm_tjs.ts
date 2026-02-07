import { WASI } from 'tjs:wasi';
import path from 'tjs:path';
import * as constants from '../lib/llhttp/constants';
import { CB_TYPE, hgGetState, transferBuffer, type HGAPI } from '../lib/HGAPI';

const bin = (await tjs.readFile(
  path.resolve(tjs.cwd, 'build/llhttp.wasm'),
)) as Uint8Array<ArrayBuffer>;
const mod = new WebAssembly.Module(bin);

const wasi = new WASI({
  version: 'wasi_snapshot_preview1',
});

const inst = new WebAssembly.Instance(mod, wasi.getImportObject());
const api = inst.exports as unknown as HGAPI;

// console.log(inst.exports);
let parser;
let buffer;
try {
  const encoder = new TextEncoder();
  const request = encoder.encode(
    // 'GET / HTTP/1.1\r\nhost: asd.com\r\n\r\n',
    `GET /api/v1/whoami HTTP/2.0
Host: developer.mozilla.org
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0
Accept: */*
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br, zstd
Referer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/set
Connection: keep-alive
Cookie: _ga_B9CY1C9VBC=GS1.1.1741620178.5.1.1741620806.0.0.0; _ga=GA1.1.1725769720.1722229432; _ga_2VC139B3XV=GS2.1.s1764752973$o9$g0$t1764753133$j60$l0$h0
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Priority: u=4
Pragma: no-cache
Cache-Control: no-cache
TE: trailers


`,
  );
  buffer = transferBuffer(request, api);
  parser = api.hg_create(constants.TYPE.REQUEST);
  if (!parser) throw new Error('Failed to create parser');
  console.log(`parser = ${parser}\ndata = ${buffer}\nsize=${request.byteLength}\n`);
  console.log(request.byteLength);
  api.hg_begin(parser, buffer, request.byteLength);

  let state = hgGetState(parser, api);
  console.log(state);
  api.hg_print_error_reason(parser);

  while (state.last_error === 21 && state.last_cb !== CB_TYPE.CB_TYPE_on_message_complete) {
    api.hg_next(parser);
    state = hgGetState(parser, api);
    api.hg_print_error_reason(parser);
    console.log(state);
  }

  api.hg_dump(buffer);
} finally {
  api.hg_free(buffer);
  api.hg_destroy(parser);
}
