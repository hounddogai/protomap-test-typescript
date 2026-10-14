import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyInsightSegmentView, toLegacyInsightSegmentViews } from "./legacy-insight-segment-view.js";
import { newLegacyInsightSegment } from "./legacy-insight-segment.js";

test("LegacyInsightSegmentView shows the status in capitals", () => {
  const item = newLegacyInsightSegment("code-339", "title-362");
  const view = toLegacyInsightSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyInsightSegmentViews([item, item]).length, 2, "views");
});
