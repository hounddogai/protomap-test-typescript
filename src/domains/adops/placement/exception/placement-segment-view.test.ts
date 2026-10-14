import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementSegmentView, toPlacementSegmentViews } from "./placement-segment-view.js";
import { newPlacementSegment } from "./placement-segment.js";

test("PlacementSegmentView shows the status in capitals", () => {
  const item = newPlacementSegment("code-570", "title-712");
  const view = toPlacementSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementSegmentViews([item, item]).length, 2, "views");
});
