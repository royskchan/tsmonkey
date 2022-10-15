import * as repl from "./repl/repl";
import os from "os";

function main() {
  let username = os.userInfo().username;

  console.log(`Hello ${username}! This is the Monkey programming language!`);
  console.log("Feel free to type in commands");
  repl.start();
}

main();
