import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultRedemptionExceptionEngine } from "./default-redemption-exception-engine.js";
import { newDefaultRedemptionException } from "./default-redemption-exception.js";

test("DefaultRedemptionExceptionEngine keeps results within bounds", () => {
  const engine = defaultDefaultRedemptionExceptionEngine();
  const item = newDefaultRedemptionException("code-376", "label-188");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
