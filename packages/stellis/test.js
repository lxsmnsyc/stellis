import { $$component as _$$component } from "stellis";
import { getContext, setContext, createContext, render } from 'stellis';
const example = createContext();
function Child() {
  console.log(getContext(example));
  return getContext(example);
}
function Parent({
  value
}) {
  setContext(example, value);
  return _$$component(Child, {});
}
render(() => ["\n  ", _$$component(Parent, {
  "value": "Hello"
}), "\n  ", _$$component(Parent, {
  "value": "World"
}), "\n"]).then(console.log);