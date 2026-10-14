import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleAdjustmentEngine } from "./bid-rule-adjustment-engine.js";
import { newBidRuleAdjustment } from "./bid-rule-adjustment.js";

test("BidRuleAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultBidRuleAdjustmentEngine();
  const item = newBidRuleAdjustment("code-94", "name-273");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
