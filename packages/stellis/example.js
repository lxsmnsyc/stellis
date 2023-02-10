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

console.log(await render(<stellis:comment value="<script>Hello World</script>" />));
`).then(console.log);