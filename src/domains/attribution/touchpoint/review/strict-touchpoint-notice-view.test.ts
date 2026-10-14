import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictTouchpointNoticeView, toStrictTouchpointNoticeViews } from "./strict-touchpoint-notice-view.js";
import { newStrictTouchpointNotice } from "./strict-touchpoint-notice.js";

test("StrictTouchpointNoticeView shows the status in capitals", () => {
  const item = newStrictTouchpointNotice("code-530", "label-646");
  const view = toStrictTouchpointNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictTouchpointNoticeViews([item, item]).length, 2, "views");
});
