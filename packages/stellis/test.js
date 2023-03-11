import { $$html as _$$html } from "stellis";
const _template = ["<h1>", "</h1>"];
import { render } from 'stellis';
const sleep = ms => new Promise(res => {
  setTimeout(res, ms, true);
});
const value = async x => {
  await sleep(1000);
  return x;
};

console.log(await render(_$$html(_template, true, async _v => (_v = await value('Hello World'), _v))));