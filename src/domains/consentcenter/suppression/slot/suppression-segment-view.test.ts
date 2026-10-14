import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionSegmentView, toSuppressionSegmentViews } from "./suppression-segment-view.js";
import { newSuppressionSegment } from "./suppression-segment.js";

test("SuppressionSegmentView shows the status in capitals", () => {
  const item = newSuppressionSegment("code-255", "name-367");
  const view = toSuppressionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionSegmentViews([item, item]).length, 2, "views");
});
