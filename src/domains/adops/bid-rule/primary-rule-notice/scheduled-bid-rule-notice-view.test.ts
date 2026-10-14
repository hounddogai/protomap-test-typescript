import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledBidRuleNoticeView, toScheduledBidRuleNoticeViews } from "./scheduled-bid-rule-notice-view.js";
import { newScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

test("ScheduledBidRuleNoticeView shows the status in capitals", () => {
  const item = newScheduledBidRuleNotice("code-425", "label-457");
  const view = toScheduledBidRuleNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledBidRuleNoticeViews([item, item]).length, 2, "views");
});
