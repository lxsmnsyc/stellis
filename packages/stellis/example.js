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
import { getContext, setContext, createContext, render } from 'stellis';

const example = createContext();

function Child() {
  console.log(getContext(example));
}

function Parent({ value }) {
  setContext(example, value);
  return <Child />
}

render(<>
  <Parent value="Hello" />
  <Parent value="World" />
</>).then(console.log)

`).then(console.log);