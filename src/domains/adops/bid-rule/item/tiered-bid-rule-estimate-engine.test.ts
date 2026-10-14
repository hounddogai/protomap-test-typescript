import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBidRuleEstimateEngine } from "./tiered-bid-rule-estimate-engine.js";
import { newTieredBidRuleEstimate } from "./tiered-bid-rule-estimate.js";

test("TieredBidRuleEstimateEngine keeps results within bounds", () => {
  const engine = defaultTieredBidRuleEstimateEngine();
  const item = newTieredBidRuleEstimate("code-790", "title-863");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
