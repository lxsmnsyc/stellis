import { $$comment as _$$comment } from "stellis";
import { render } from 'stellis';
console.log(await render(_$$comment({
  "value": "Hello World"
})));