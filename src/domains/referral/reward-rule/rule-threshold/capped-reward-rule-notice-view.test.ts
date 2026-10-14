import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedRewardRuleNoticeView, toCappedRewardRuleNoticeViews } from "./capped-reward-rule-notice-view.js";
import { newCappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

test("CappedRewardRuleNoticeView shows the status in capitals", () => {
  const item = newCappedRewardRuleNotice("code-852", "label-25");
  const view = toCappedRewardRuleNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedRewardRuleNoticeViews([item, item]).length, 2, "views");
});
