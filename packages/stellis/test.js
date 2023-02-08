import { $$component as _$$component } from "stellis";
import { $$html as _$$html } from "stellis";
import { $$attr as _$$attr } from "stellis";
import { $$inject as _$$inject } from "stellis";
const _template = ["<title>", "</title>"],
  _template2 = ["<h1>", "</h1>"],
  _template3 = ["<html>", "</html>"],
  _template4 = ["<head>", "</head>"],
  _template5 = ["<body>", "</body>"];
import { render } from 'stellis';
function Example() {
  return [_$$inject("head", {
    children: _$$html(_template, "Hello World")
  }), _$$html(_template2, "Hello World")];
}
const result = await render(_$$html(_template3, [_$$html(_template4, []), _$$html(_template5, _$$component(Example, 
{}))]));
console.log(result);

// Output:
<html><head><title>Hello World</title></head><body><h1>Hello World</h1></body></html>