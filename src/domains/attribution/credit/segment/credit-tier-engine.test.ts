import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditTierEngine } from "./credit-tier-engine.js";
import { newCreditTier } from "./credit-tier.js";

test("CreditTierEngine keeps results within bounds", () => {
  const engine = defaultCreditTierEngine();
  const item = newCreditTier("code-85", "label-354");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
