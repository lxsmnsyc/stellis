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

function Example() {
  return (
    <>
      <stellis:head>
        <title>Hello World</title>
      </stellis:head>
      <h1>Hello World</h1>
    </>
  );
}

const result = await render(
  <html>
    <head />
    <body>
      <Example />
    </body>
  </html>
);

console.log(result);
`).then(console.log);