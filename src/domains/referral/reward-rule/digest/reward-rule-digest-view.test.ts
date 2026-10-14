import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleDigestView, toRewardRuleDigestViews } from "./reward-rule-digest-view.js";
import { newRewardRuleDigest } from "./reward-rule-digest.js";

test("RewardRuleDigestView shows the status in capitals", () => {
  const item = newRewardRuleDigest("code-391", "title-197");
  const view = toRewardRuleDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleDigestViews([item, item]).length, 2, "views");
});
