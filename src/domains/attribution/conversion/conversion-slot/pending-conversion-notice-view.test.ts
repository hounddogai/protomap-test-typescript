import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingConversionNoticeView, toPendingConversionNoticeViews } from "./pending-conversion-notice-view.js";
import { newPendingConversionNotice } from "./pending-conversion-notice.js";

test("PendingConversionNoticeView shows the status in capitals", () => {
  const item = newPendingConversionNotice("code-123", "title-88");
  const view = toPendingConversionNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingConversionNoticeViews([item, item]).length, 2, "views");
});
