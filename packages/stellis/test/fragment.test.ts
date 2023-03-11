import { describe, it, expect } from "vitest";
import transformStellis from "./utils";

describe('fragment', () => {
  it('should transform fragment with static child element', async () => {
    const code = `
      <>
        <h1>Hello World</h1>
        <h1>Hello World</h1>
      </>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
  it('should transform fragment with dynamic child element', async () => {
    const code = `
      <>
        {dynamicChild()}
        {dynamicChild()}
      </>
    `;

    expect(await transformStellis(code)).toMatchSnapshot();
  });
});