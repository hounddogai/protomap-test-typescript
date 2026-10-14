import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutNoticeView, toPayoutNoticeViews } from "./payout-notice-view.js";
import { newPayoutNotice } from "./payout-notice.js";

test("PayoutNoticeView shows the status in capitals", () => {
  const item = newPayoutNotice("code-915", "label-385");
  const view = toPayoutNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutNoticeViews([item, item]).length, 2, "views");
});
