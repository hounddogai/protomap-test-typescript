import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightSegmentView, toInsightSegmentViews } from "./insight-segment-view.js";
import { newInsightSegment } from "./insight-segment.js";

test("InsightSegmentView shows the status in capitals", () => {
  const item = newInsightSegment("code-835", "title-302");
  const view = toInsightSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightSegmentViews([item, item]).length, 2, "views");
});
