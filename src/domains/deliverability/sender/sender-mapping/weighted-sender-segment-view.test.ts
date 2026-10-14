import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedSenderSegmentView, toWeightedSenderSegmentViews } from "./weighted-sender-segment-view.js";
import { newWeightedSenderSegment } from "./weighted-sender-segment.js";

test("WeightedSenderSegmentView shows the status in capitals", () => {
  const item = newWeightedSenderSegment("code-913", "label-958");
  const view = toWeightedSenderSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedSenderSegmentViews([item, item]).length, 2, "views");
});
