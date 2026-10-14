import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredStepSegmentView, toTieredStepSegmentViews } from "./tiered-step-segment-view.js";
import { newTieredStepSegment } from "./tiered-step-segment.js";

test("TieredStepSegmentView shows the status in capitals", () => {
  const item = newTieredStepSegment("code-793", "label-608");
  const view = toTieredStepSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredStepSegmentViews([item, item]).length, 2, "views");
});
