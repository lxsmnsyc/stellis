import stellisPlugin from 'stellis/babel';
import * as babel from '@babel/core';

async function transform(code) {
  const result = await babel.transformAsync(code, {
    plugins: [
      [stellisPlugin],
    ],
    parserOpts: {
      plugins: ['jsx'],
    },
  });

  return result.code;
}

transform(`
import { render } from 'stellis';

const sleep = (ms) => new Promise((res) => {
  setTimeout(res, ms, true);
});

const value = async (x) => {
  await sleep(1000);
  return x;
};

console.log(await render(<h1>{await value('Hello World')}</h1>));
`).then(console.log);