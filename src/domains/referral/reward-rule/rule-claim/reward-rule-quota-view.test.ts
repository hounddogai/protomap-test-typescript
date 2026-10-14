import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleQuotaView, toRewardRuleQuotaViews } from "./reward-rule-quota-view.js";
import { newRewardRuleQuota } from "./reward-rule-quota.js";

test("RewardRuleQuotaView shows the status in capitals", () => {
  const item = newRewardRuleQuota("code-942", "label-620");
  const view = toRewardRuleQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleQuotaViews([item, item]).length, 2, "views");
});
