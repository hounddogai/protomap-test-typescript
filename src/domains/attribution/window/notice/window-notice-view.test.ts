import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowNoticeView, toWindowNoticeViews } from "./window-notice-view.js";
import { newWindowNotice } from "./window-notice.js";

test("WindowNoticeView shows the status in capitals", () => {
  const item = newWindowNotice("code-306", "title-167");
  const view = toWindowNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowNoticeViews([item, item]).length, 2, "views");
});
