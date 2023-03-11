import { describe, it, expect } from 'vitest';
import transformStellis from './utils';

describe('elements', () => {
  it('should transform basic', async () => {
    const code = `
      <h1>Hello World</h1>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with static attribute', async () => {
    const code = `
      <h1 title="hello world">Hello World</h1>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with dynamic attribute', async () => {
    const code = `
      <h1 title={getTitle()}>Hello World</h1>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with async dynamic attribute', async () => {
    const code = `
      <h1 title={await getTitle()}>Hello World</h1>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with static child element', async () => {
    const code = `
      <div>
        <h1>Hello World</h1>
        <h1>Hello World</h1>
      </div>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with dynamic child element', async () => {
    const code = `
      <div>
        {dynamicChild()}
        {dynamicChild()}
      </div>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with dynamic child element', async () => {
    const code = `
      <div>
        {await dynamicChild()}
        {await dynamicChild()}
      </div>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with nested static child element', async () => {
    const code = `
      <div>
        <div>
          <h1>Hello World</h1>
          <h1>Hello World</h1>
        </div>
        <div>
          <h1>Hello World</h1>
          <h1>Hello World</h1>
        </div>
      </div>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform class attribute', async () => {
    const code = `
      <h1 class="example">Hello</h1>;
      <h1 class={["a", condB && b]}>Array</h1>;
      <h1 class={{ a: true, b: condB, c: condC }}>Object</h1>;
      <h1 class={["a", { b: condB }, [condC && "c"]]}>Nested</h1>;
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform class:* attribute', async () => {
    const code = `
      <h1 class:example>Hello</h1>;
      <h1 class:a class:b={cond}>Another Example</h1>;
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform style attribute', async () => {
    const code = `
      <div style={{ color: 'red' }}>Hello World</div>;
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform style:* attribute', async () => {
    const code = `
      <h1 style:color="red">Red Heading 2</h1>;
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform set:html attribute', async () => {
    const code = `
      <div set:html="<script>Hello World</script>" />
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
