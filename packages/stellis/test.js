import { $$html as _$$html } from "stellis";
import { $$attr as _$$attr } from "stellis";
const _template = ["<div><script>Hello World</script></div>"],
  _template2 = ["<div>", "</div>"];
import { render } from 'stellis';
console.log(await render(_$$html(_template, false)));
console.log(await render(_$$html(_template2, true, "<script>Hello World</script>")));