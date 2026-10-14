import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalApprovalNoticeView, toRegionalApprovalNoticeViews } from "./regional-approval-notice-view.js";
import { newRegionalApprovalNotice } from "./regional-approval-notice.js";

test("RegionalApprovalNoticeView shows the status in capitals", () => {
  const item = newRegionalApprovalNotice("code-233", "label-691");
  const view = toRegionalApprovalNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalApprovalNoticeViews([item, item]).length, 2, "views");
});
