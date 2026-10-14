import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleClaimView, toRewardRuleClaimViews } from "./reward-rule-claim-view.js";
import { newRewardRuleClaim } from "./reward-rule-claim.js";

test("RewardRuleClaimView shows the status in capitals", () => {
  const item = newRewardRuleClaim("code-826", "label-349");
  const view = toRewardRuleClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleClaimViews([item, item]).length, 2, "views");
});
