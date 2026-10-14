import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackFraudCheckExceptionEngine } from "./fallback-fraud-check-exception-engine.js";
import { newFallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

test("FallbackFraudCheckExceptionEngine keeps results within bounds", () => {
  const engine = defaultFallbackFraudCheckExceptionEngine();
  const item = newFallbackFraudCheckException("code-932", "label-727");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
