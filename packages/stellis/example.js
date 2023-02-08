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

console.log(await render(<div set:html="<script>Hello World</script>" />));
console.log(await render(<div><>{'<script>Hello World</script>'}</></div>));
`).then(console.log);