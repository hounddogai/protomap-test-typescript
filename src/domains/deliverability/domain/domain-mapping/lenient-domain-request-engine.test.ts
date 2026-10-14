import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientDomainRequestEngine } from "./lenient-domain-request-engine.js";
import { newLenientDomainRequest } from "./lenient-domain-request.js";

test("LenientDomainRequestEngine keeps results within bounds", () => {
  const engine = defaultLenientDomainRequestEngine(flags.newRegistry());
  const item = newLenientDomainRequest("code-31", "name-633");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
