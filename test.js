const ab = new ArrayBuffer(16 * 4);
const i1 = new Uint8Array(2);
i1[0] = 99;
i1[1] = 12;

const ab8 = new Uint8Array(ab, 8);
ab8.set(i1);

const i4 = new Uint32Array(ab);
console.log(i4);
