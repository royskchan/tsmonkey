let a = 1;
let b = "good";
let c = true;

function validate(v: any) {
  if (typeof v === "number") {
    console.log(`${v} is number`);
  } else if (typeof v === "string") {
    console.log(`${v} is string`);
  } else {
    console.log(`${v} is not number|string. got=${typeof v}`);
  }
}

type NotNull = string;

function getNullable(): NotNull | null {
  return null;
}

let notNull: NotNull;
notNull = undefined!;
console.log(`notNull:${notNull}||${!!notNull}||${notNull || "default"}`);
notNull = getNullable()!;

console.log(`notNull:${notNull}||${!!notNull}||${notNull || "default"}`);
let arr = [1, 2, 3];
let arr2 = [...arr];
arr2.push(4);
console.log(arr);
console.log(arr2);

let m: { [key: string]: number } = {};
m["a"] = 1;
m["b"] = 2;
m["c"] = 3;
console.log("m:" + Object.keys(m).length);
for (let k in m) {
  console.log(m[k]);
}
validate(a);
validate(b);
validate(c);
