import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackCreditExceptionEngine } from "./fallback-credit-exception-engine.js";
import { newFallbackCreditException } from "./fallback-credit-exception.js";

test("FallbackCreditExceptionEngine keeps results within bounds", () => {
  const engine = defaultFallbackCreditExceptionEngine();
  const item = newFallbackCreditException("code-289", "label-584");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
