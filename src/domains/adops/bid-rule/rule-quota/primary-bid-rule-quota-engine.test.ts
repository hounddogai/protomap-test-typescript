import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryBidRuleQuotaEngine } from "./primary-bid-rule-quota-engine.js";
import { newPrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

test("PrimaryBidRuleQuotaEngine keeps results within bounds", () => {
  const engine = defaultPrimaryBidRuleQuotaEngine(flags.newRegistry());
  const item = newPrimaryBidRuleQuota("code-290", "title-846");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
