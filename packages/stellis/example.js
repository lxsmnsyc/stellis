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
import { Dynamic, render } from 'stellis';

function Example({ as, children }) {
  return <Dynamic component={as}>{children}</Dynamic>;
}

const result = await render(
  <Example as="h1">Hello World</Example>
);
console.log(result);
`).then(console.log);