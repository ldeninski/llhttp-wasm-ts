import path from 'tjs:path';
import * as constants from '../lib/llhttp/constants';

const bin = (await tjs.readFile(
  path.resolve(tjs.cwd, 'build/llhttp-test.wasm'),
)) as Uint8Array<ArrayBuffer>;
const mod = new WebAssembly.Module(bin);

const inst = new WebAssembly.Instance(mod);

console.log(inst.exports.test());
