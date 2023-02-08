# stellis

> A no-VDOM, JSX framework for SSR

[![NPM](https://img.shields.io/npm/v/stellis.svg)](https://www.npmjs.com/package/stellis) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)

## Setup

### Install

```bash
npm install --save stellis
```

```bash
yarn add stellis
```

```bash
pnpm add stellis
```

### Babel

Stellis uses [Babel](https://babeljs.io/) to transform your JSX and is provided in the form a plugin exported through `stellis/babel`.

### Integrations

- Rollup (SOON)
- Vite (SOON)
- ESBuild (SOON)

## Usage

### Rendering JSX

```js
import { render } from 'stellis';

const result = await render(<h1>Hello World</h1>);
console.log(result); // <h1>Hello World</h1>
```

Stellis JSX is unlike your usual, React-like JSX:

- Stellis has no VDOM
  - The babel compiler will always generate optimized templates from the JSX
- Stellis' attributes are closer to HTML
  - React introduced some properties like `className`, `htmlFor` and `readOnly` to be closer to DOM than HTML, which is the opposite of Stellis, where you can write `class`, `html` and `readonly`.
- Rendering is always async

### Writing your first component

```js
function Message({ greeting, receiver }) {
  return <h1>{greeting}, {receiver}</h1>;
}

const result = await render(
  <Message greeting="Hello" receiver="World" />
); // <h1>Hello World</h1>
```

### Async components

```js
async function Profile({ id }) {
  const user = await getUser(id);

  return <ProfileDetails user={user} />;
} 
```

```js
async function Profile({ id }) {
  return <ProfileDetails user={await getUser(id)} />;
} 
```

### Context API

```js
import { createContext, setContext, getContext, render } from 'stellis';

const message = createContext('Hello World');

function Parent({ children }) {
  setContext(message, 'Bonjour World');

  return children;
}

function Child() {
  return <h1>{getContext(message)}</h1>; // Hello World
}

const result = await render(
  <>
    <Parent>
      <Child />
    </Parent>
    <Child />
  </>
);

console.log(result);

// Output
// <h1>Bonjour World</h1><h1>Hello World</h1>
```

### Error Boundaries

```js
import { ErrorBoundary, render } from 'stellis';

function FailingComponent() {
  throw new Error('Example');
}

const result = await render(
  <ErrorBoundary
    fallback={(error) => <>
      <h1>Error: {error.name}</h1>
      <p>Message: {error.message}</p>
    </>}
  >
    <FailingComponent />
  </ErrorBoundary>
);
console.log(result);
// Output: <h1>Error: Error</h1><p>Message: Example</p>
```

### `Dynamic`

```js
import { Dynamic, render } from 'stellis';

function Example({ as, children }) {
  return <Dynamic component={as}>{children}</Dynamic>;
}

const result = await render(
  <Example as="h1">Hello World</Example>
);
console.log(result);
// Output: <h1>Hello World</h1>
```

### Stellis namespace

#### `<stellis:head>`

```js
<stellis:head type="pre">
  <title>Hello World</title>
</stellis:head>
```

#### `<stellis:body>`

```js
<stellis:body type="post">
  <script src="./my-script.js" />
</stellis:body>
```

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
