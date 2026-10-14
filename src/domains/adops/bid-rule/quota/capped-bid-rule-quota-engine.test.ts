import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedBidRuleQuotaEngine } from "./capped-bid-rule-quota-engine.js";
import { newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

test("CappedBidRuleQuotaEngine keeps results within bounds", () => {
  const engine = defaultCappedBidRuleQuotaEngine();
  const item = newCappedBidRuleQuota("code-667", "title-571");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
