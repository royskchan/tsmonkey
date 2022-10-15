import { expect } from "chai";
import * as object from "../object/object";

describe("ObjectTest", function () {
  // test: testStringHashKey
  it("testStringHashKey", function () {
    let hello1 = new object.String("Hello World");
    let hello2 = new object.String("Hello World");
    let diff1 = new object.String("My name is johnny");
    let diff2 = new object.String("My name is johnny");

    expect(hello1.hashKey() === hello2.hashKey()).equal(
      true,
      "strings with same content have different hash keys"
    );

    expect(diff1.hashKey() === diff2.hashKey()).equal(
      true,
      "strings with same content have different hash keys"
    );

    expect(hello1.hashKey() === diff1.hashKey()).equal(
      false,
      "strings with same content have same has keys"
    );
  });
});
