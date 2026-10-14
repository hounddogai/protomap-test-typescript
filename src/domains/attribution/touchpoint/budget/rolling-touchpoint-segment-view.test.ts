import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingTouchpointSegmentView,
  toRollingTouchpointSegmentViews,
} from "./rolling-touchpoint-segment-view.js";
import { newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

test("RollingTouchpointSegmentView shows the status in capitals", () => {
  const item = newRollingTouchpointSegment("code-772", "name-806");
  const view = toRollingTouchpointSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingTouchpointSegmentViews([item, item]).length, 2, "views");
});
