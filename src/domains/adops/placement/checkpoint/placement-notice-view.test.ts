import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementNoticeView, toPlacementNoticeViews } from "./placement-notice-view.js";
import { newPlacementNotice } from "./placement-notice.js";

test("PlacementNoticeView shows the status in capitals", () => {
  const item = newPlacementNotice("code-314", "name-77");
  const view = toPlacementNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementNoticeViews([item, item]).length, 2, "views");
});
