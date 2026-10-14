import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedRewardRuleQuotaView, toBatchedRewardRuleQuotaViews } from "./batched-reward-rule-quota-view.js";
import { newBatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

test("BatchedRewardRuleQuotaView shows the status in capitals", () => {
  const item = newBatchedRewardRuleQuota("code-700", "title-795");
  const view = toBatchedRewardRuleQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedRewardRuleQuotaViews([item, item]).length, 2, "views");
});
