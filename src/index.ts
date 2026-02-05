export class LLHTTPStatic {
  static #instance: LLHTTPStatic;

  public constructor() {
    return (LLHTTPStatic.#instance ??= this);
  }

  public token = Math.random();
}

const i1 = new LLHTTPStatic();
const i2 = new LLHTTPStatic();

console.log(i1 === i2);
