import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledBidRuleQuotaEngine } from "./scheduled-bid-rule-quota-engine.js";
import { newScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

test("ScheduledBidRuleQuotaEngine keeps results within bounds", () => {
  const engine = defaultScheduledBidRuleQuotaEngine();
  const item = newScheduledBidRuleQuota("code-542", "name-360");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
