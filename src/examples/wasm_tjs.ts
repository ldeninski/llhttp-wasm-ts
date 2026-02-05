import { WASI } from 'tjs:wasi';
import path from 'tjs:path';
import * as constants from '../lib/llhttp/constants';

const bin = (await tjs.readFile(
  path.resolve(tjs.cwd, 'build/llhttp.wasm'),
)) as Uint8Array<ArrayBuffer>;
const mod = new WebAssembly.Module(bin);

const wasi = new WASI({
  version: 'wasi_snapshot_preview1',
});

const inst = new WebAssembly.Instance(mod, wasi.getImportObject());

console.log(inst.exports);
let parser;
try {
  parser = inst.exports.hg_create(constants.TYPE.REQUEST);
  console.log(parser);
} finally {
  inst.exports.hg_destroy(parser);
}
