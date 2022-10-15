import * as lexer from "../lexer/lexer";
import * as parser from "../parser/parser";
import * as evaluator from "../evaluator/evaluator";
import * as object from "../object/object";
import readline from "readline-sync";

const PROMPT = ">> ";

const MONKEY_FACE = `
            __,__
   .--.  .-"     "-.  .--.
  / .. \\/  .-. .-.  \\/ .. \\
 | |  '|  /   Y   \\  |'  | |
 | \\   \\  \\ 0 | 0 /  /   / |
  \\ '- ,\\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\\ '-''
       |  \\._   _./  |
       \\   \\ '~' /   /
        '._ '-=-' _.'
           '-----'
`;

export function start() {
  let work = true;
  let env = new object.Environment();
  while (work) {
    let line = readline.question(PROMPT);
    let l = new lexer.Lexer(line);
    let p = new parser.Parser(l);
    let program = p.parseProgram();

    if (p.errors().length !== 0) {
      printParserErrors(p.errors());
      continue;
    }
    let e = new evaluator.Evaluator();
    let evaluated = e.eval(program, env);
    if (evaluated) {
      console.log(evaluated.inspect());
    }
  }
}

function printParserErrors(errors: string[]) {
  console.log(MONKEY_FACE);
  console.log("Woops! We ran into some monkey business here!");
  console.log(" parser errors:");
  for (let msg of errors) {
    console.log(`\t${msg}`);
  }
}
