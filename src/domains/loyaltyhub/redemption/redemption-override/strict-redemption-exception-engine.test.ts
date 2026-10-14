import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictRedemptionExceptionEngine } from "./strict-redemption-exception-engine.js";
import { newStrictRedemptionException } from "./strict-redemption-exception.js";

test("StrictRedemptionExceptionEngine keeps results within bounds", () => {
  const engine = defaultStrictRedemptionExceptionEngine();
  const item = newStrictRedemptionException("code-281", "title-424");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
