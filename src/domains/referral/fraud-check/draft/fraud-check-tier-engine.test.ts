import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckTierEngine } from "./fraud-check-tier-engine.js";
import { newFraudCheckTier } from "./fraud-check-tier.js";

test("FraudCheckTierEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckTierEngine();
  const item = newFraudCheckTier("code-710", "label-425");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
