import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPlacementNoticeView, toRollingPlacementNoticeViews } from "./rolling-placement-notice-view.js";
import { newRollingPlacementNotice } from "./rolling-placement-notice.js";

test("RollingPlacementNoticeView shows the status in capitals", () => {
  const item = newRollingPlacementNotice("code-845", "name-853");
  const view = toRollingPlacementNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPlacementNoticeViews([item, item]).length, 2, "views");
});
