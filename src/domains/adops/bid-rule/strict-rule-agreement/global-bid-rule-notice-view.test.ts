import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBidRuleNoticeView, toGlobalBidRuleNoticeViews } from "./global-bid-rule-notice-view.js";
import { newGlobalBidRuleNotice } from "./global-bid-rule-notice.js";

test("GlobalBidRuleNoticeView shows the status in capitals", () => {
  const item = newGlobalBidRuleNotice("code-68", "name-318");
  const view = toGlobalBidRuleNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBidRuleNoticeViews([item, item]).length, 2, "views");
});
