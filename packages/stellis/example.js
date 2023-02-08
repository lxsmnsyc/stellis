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
<head />

`).then(console.log);