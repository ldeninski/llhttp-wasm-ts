import path from 'tjs:path';
import { HTTPProtocolIterator } from '../lib/HG';
import { requestFixture, requestFixturePart1, requestFixturePart2 } from '../fixtures/request';

const bin = (await tjs.readFile(path.resolve(tjs.cwd, 'build/llhttp.wasm'))) as Uint8Array<ArrayBuffer>;
const mod = new WebAssembly.Module(bin);

const hg = new HTTPProtocolIterator(16 * 1024, mod);

let appended = false;

try {
  let lastSerial = -1;
  for (const state of hg.begin(requestFixturePart1)) {
    console.log(`${state.callback}\t${state.serial}\t"${state.value}"`);
    if (lastSerial === state.serial) {
      if (!appended) {
        console.log('stream is stuck -> appending');
        state.append(requestFixturePart2);
        appended = true;
      } else {
        console.log('stream is stuck');
        hg.DUMP();
        break;
      }
    }
    lastSerial = state.serial;
  }

  // console.log(hg.state);
} catch (e) {
  console.log(hg);
  throw e;
}
