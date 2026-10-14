import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingBidRuleNoticeView, toPendingBidRuleNoticeViews } from "./pending-bid-rule-notice-view.js";
import { newPendingBidRuleNotice } from "./pending-bid-rule-notice.js";

test("PendingBidRuleNoticeView shows the status in capitals", () => {
  const item = newPendingBidRuleNotice("code-111", "title-416");
  const view = toPendingBidRuleNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingBidRuleNoticeViews([item, item]).length, 2, "views");
});
