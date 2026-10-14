import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledPlacementNoticeView,
  toScheduledPlacementNoticeViews,
} from "./scheduled-placement-notice-view.js";
import { newScheduledPlacementNotice } from "./scheduled-placement-notice.js";

test("ScheduledPlacementNoticeView shows the status in capitals", () => {
  const item = newScheduledPlacementNotice("code-244", "label-126");
  const view = toScheduledPlacementNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledPlacementNoticeViews([item, item]).length, 2, "views");
});
