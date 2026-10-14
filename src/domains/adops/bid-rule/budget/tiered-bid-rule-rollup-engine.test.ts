import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBidRuleRollupEngine } from "./tiered-bid-rule-rollup-engine.js";
import { newTieredBidRuleRollup } from "./tiered-bid-rule-rollup.js";

test("TieredBidRuleRollupEngine keeps results within bounds", () => {
  const engine = defaultTieredBidRuleRollupEngine();
  const item = newTieredBidRuleRollup("code-180", "label-743");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
