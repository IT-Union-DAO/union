import fs from 'fs';
import { lexer } from './lexer';
import { Parser } from './parser';
import { TId, TProg } from './cst';

const candid = fs.readFileSync('../../wallet-backend/can.did').toString();

export function parseCandid(candid: string): TProg {
  const lexerResult = lexer.tokenize(candid);
  Parser.input = lexerResult.tokens;
  const prog = Parser.prog();

  if (Parser.errors.length > 0) {
    for (let i in Parser.errors) {
      console.error(`Parser error #${i}: `, Parser.errors[i]);
    }

    throw new Error('Throwing due to previous errors');
  }

  return prog;
}

let prog = parseCandid(candid);
console.log('actor', prog.getIdlActor());

console.log(
  /*JSON.stringify*/ prog
    .traverseIdlType(new TId('CreateNestedVotingConfigRequest'))
    // @ts-ignore
    ._fields.find((it) => it[0] == 'allowee_groups')[1]._type._fields,
);
