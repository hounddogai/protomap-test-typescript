import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRewardRuleNoticeView, toPendingRewardRuleNoticeViews } from "./pending-reward-rule-notice-view.js";
import { newPendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

test("PendingRewardRuleNoticeView shows the status in capitals", () => {
  const item = newPendingRewardRuleNotice("code-471", "name-130");
  const view = toPendingRewardRuleNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRewardRuleNoticeViews([item, item]).length, 2, "views");
});
