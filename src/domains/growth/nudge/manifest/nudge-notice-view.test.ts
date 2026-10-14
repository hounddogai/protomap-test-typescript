import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeNoticeView, toNudgeNoticeViews } from "./nudge-notice-view.js";
import { newNudgeNotice } from "./nudge-notice.js";

test("NudgeNoticeView shows the status in capitals", () => {
  const item = newNudgeNotice("code-611", "title-993");
  const view = toNudgeNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeNoticeViews([item, item]).length, 2, "views");
});
