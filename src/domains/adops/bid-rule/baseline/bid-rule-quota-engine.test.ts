import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleQuotaEngine } from "./bid-rule-quota-engine.js";
import { newBidRuleQuota } from "./bid-rule-quota.js";

test("BidRuleQuotaEngine keeps results within bounds", () => {
  const engine = defaultBidRuleQuotaEngine();
  const item = newBidRuleQuota("code-892", "title-492");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
