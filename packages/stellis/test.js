import { $$component as _$$component } from "stellis";
import { Dynamic, render } from 'stellis';
function Example({
  as,
  children
}) {
  return _$$component(Dynamic, {
    "component": as,
    children: children
  });
}
const result = await render(_$$component(Example, {
  "as": "h1",
  children: "Hello World"
}));
console.log(result);