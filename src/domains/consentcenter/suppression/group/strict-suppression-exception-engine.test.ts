import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictSuppressionExceptionEngine } from "./strict-suppression-exception-engine.js";
import { newStrictSuppressionException } from "./strict-suppression-exception.js";

test("StrictSuppressionExceptionEngine keeps results within bounds", () => {
  const engine = defaultStrictSuppressionExceptionEngine();
  const item = newStrictSuppressionException("code-616", "name-169");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
