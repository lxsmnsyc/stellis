import { describe, it, expect } from 'vitest';
import transformStellis from './utils';

describe('error-boundary', () => {
  it('should transform', async () => {
    const code = `
    <stellis:error-boundary
      fallback={(error) => <>
        <h1>Error: {error.name}</h1>
        <p>Message: {error.message}</p>
      </>}
    >
      <FailingComponent />
    </stellis:error-boundary>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
describe('fragment', () => {
  it('should transform', async () => {
    const code = `
    <stellis:fragment set:html="<script>Hello World</script>" />
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
describe('comment', () => {
  it('should transform', async () => {
    const code = `
      <stellis:comment value="This is a comment." />
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
describe('head', () => {
  it('should transform', async () => {
    const code = `
      <stellis:head type="pre">
        <title>Hello World</title>
      </stellis:head>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
describe('body', () => {
  it('should transform', async () => {
    const code = `
      <stellis:body type="post">
        <script src="./my-script.js" />
      </stellis:body>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
