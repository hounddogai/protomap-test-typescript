import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRedemptionBaselineEngine } from "./redemption-baseline-engine.js";
import { newRedemptionBaseline } from "./redemption-baseline.js";

test("RedemptionBaselineEngine keeps results within bounds", () => {
  const engine = defaultRedemptionBaselineEngine();
  const item = newRedemptionBaseline("code-358", "label-251");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
