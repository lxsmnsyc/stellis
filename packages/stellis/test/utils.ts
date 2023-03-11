import * as babel from '@babel/core';
import stellisPlugin from '../babel';

export default async function transformStellis(code: string) {
  const result = await babel.transformAsync(code, {
    plugins: [
      [stellisPlugin],
    ],
    parserOpts: {
      plugins: ['jsx'],
    },
  });

  return result?.code;
}
