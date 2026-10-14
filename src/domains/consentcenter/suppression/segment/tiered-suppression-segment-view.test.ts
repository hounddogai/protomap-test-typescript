import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredSuppressionSegmentView,
  toTieredSuppressionSegmentViews,
} from "./tiered-suppression-segment-view.js";
import { newTieredSuppressionSegment } from "./tiered-suppression-segment.js";

test("TieredSuppressionSegmentView shows the status in capitals", () => {
  const item = newTieredSuppressionSegment("code-842", "name-655");
  const view = toTieredSuppressionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSuppressionSegmentViews([item, item]).length, 2, "views");
});
