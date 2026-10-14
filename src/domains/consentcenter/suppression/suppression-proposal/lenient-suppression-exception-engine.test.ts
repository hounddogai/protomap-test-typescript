import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientSuppressionExceptionEngine } from "./lenient-suppression-exception-engine.js";
import { newLenientSuppressionException } from "./lenient-suppression-exception.js";

test("LenientSuppressionExceptionEngine keeps results within bounds", () => {
  const engine = defaultLenientSuppressionExceptionEngine();
  const item = newLenientSuppressionException("code-118", "title-329");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
