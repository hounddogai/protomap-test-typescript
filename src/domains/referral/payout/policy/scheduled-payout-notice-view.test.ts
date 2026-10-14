import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledPayoutNoticeView, toScheduledPayoutNoticeViews } from "./scheduled-payout-notice-view.js";
import { newScheduledPayoutNotice } from "./scheduled-payout-notice.js";

test("ScheduledPayoutNoticeView shows the status in capitals", () => {
  const item = newScheduledPayoutNotice("code-754", "title-267");
  const view = toScheduledPayoutNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledPayoutNoticeViews([item, item]).length, 2, "views");
});
