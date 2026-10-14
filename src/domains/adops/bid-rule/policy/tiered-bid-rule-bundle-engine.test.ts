import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBidRuleBundleEngine } from "./tiered-bid-rule-bundle-engine.js";
import { newTieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

test("TieredBidRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultTieredBidRuleBundleEngine();
  const item = newTieredBidRuleBundle("code-154", "name-960");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
