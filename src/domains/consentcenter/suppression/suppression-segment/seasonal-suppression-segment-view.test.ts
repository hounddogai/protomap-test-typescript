import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalSuppressionSegmentView,
  toSeasonalSuppressionSegmentViews,
} from "./seasonal-suppression-segment-view.js";
import { newSeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

test("SeasonalSuppressionSegmentView shows the status in capitals", () => {
  const item = newSeasonalSuppressionSegment("code-205", "title-88");
  const view = toSeasonalSuppressionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSuppressionSegmentViews([item, item]).length, 2, "views");
});
