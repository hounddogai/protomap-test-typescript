import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointNoticeView, toTouchpointNoticeViews } from "./touchpoint-notice-view.js";
import { newTouchpointNotice } from "./touchpoint-notice.js";

test("TouchpointNoticeView shows the status in capitals", () => {
  const item = newTouchpointNotice("code-748", "name-675");
  const view = toTouchpointNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointNoticeViews([item, item]).length, 2, "views");
});
