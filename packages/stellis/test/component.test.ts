import { describe, it, expect } from 'vitest';
import transformStellis from './utils';

describe('component', () => {
  it('should transform basic', async () => {
    const code = `
      <Heading>Hello World</Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with static attribute', async () => {
    const code = `
      <Heading title="hello world">Hello World</Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with dynamic attribute', async () => {
    const code = `
      <Heading title={getTitle()}>Hello World</Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with async dynamic attribute', async () => {
    const code = `
      <Heading title={await getTitle()}>Hello World</Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with static child element', async () => {
    const code = `
      <Heading>
        <h1>Hello World</h1>
        <h1>Hello World</h1>
      </Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with dynamic child element', async () => {
    const code = `
      <Heading>
        {dynamicChild()}
        {dynamicChild()}
      </Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform with async dynamic child element', async () => {
    const code = `
      <Heading>
        {await dynamicChild()}
        {await dynamicChild()}
      </Heading>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});
