import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictActivationExceptionEngine } from "./strict-activation-exception-engine.js";
import { newStrictActivationException } from "./strict-activation-exception.js";

test("StrictActivationExceptionEngine keeps results within bounds", () => {
  const engine = defaultStrictActivationExceptionEngine();
  const item = newStrictActivationException("code-594", "name-517");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
