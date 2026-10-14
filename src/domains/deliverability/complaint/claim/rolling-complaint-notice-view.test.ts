import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingComplaintNoticeView, toRollingComplaintNoticeViews } from "./rolling-complaint-notice-view.js";
import { newRollingComplaintNotice } from "./rolling-complaint-notice.js";

test("RollingComplaintNoticeView shows the status in capitals", () => {
  const item = newRollingComplaintNotice("code-427", "title-83");
  const view = toRollingComplaintNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingComplaintNoticeViews([item, item]).length, 2, "views");
});
