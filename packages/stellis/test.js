import { $$component as _$$component } from "stellis";
import { getContext, setContext, createContext, render, createID } from 'stellis';
const example = createContext();
function Child() {
  console.log(getContext(example));
  console.log(createID());
}
function Parent({
  value
}) {
  console.log(value);
  setContext(example, value);
  console.log(createID());
  return _$$component(Child, () => ({}));
}
render(() => ["\n  ", _$$component(Parent, () => ({
  "value": "Hello"
})), "\n  ", _$$component(Parent, () => ({
  "value": "World"
})), "\n"]).then(console.log);