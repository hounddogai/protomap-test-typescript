import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleBundleEngine } from "./bid-rule-bundle-engine.js";
import { newBidRuleBundle } from "./bid-rule-bundle.js";

test("BidRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultBidRuleBundleEngine();
  const item = newBidRuleBundle("code-759", "label-178");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
