import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredReplyNoticeView, toTieredReplyNoticeViews } from "./tiered-reply-notice-view.js";
import { newTieredReplyNotice } from "./tiered-reply-notice.js";

test("TieredReplyNoticeView shows the status in capitals", () => {
  const item = newTieredReplyNotice("code-964", "label-342");
  const view = toTieredReplyNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredReplyNoticeViews([item, item]).length, 2, "views");
});
