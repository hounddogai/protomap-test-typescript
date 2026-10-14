import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintNoticeView, toComplaintNoticeViews } from "./complaint-notice-view.js";
import { newComplaintNotice } from "./complaint-notice.js";

test("ComplaintNoticeView shows the status in capitals", () => {
  const item = newComplaintNotice("code-378", "name-819");
  const view = toComplaintNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintNoticeViews([item, item]).length, 2, "views");
});
