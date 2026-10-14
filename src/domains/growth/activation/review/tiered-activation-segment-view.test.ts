import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredActivationSegmentView, toTieredActivationSegmentViews } from "./tiered-activation-segment-view.js";
import { newTieredActivationSegment } from "./tiered-activation-segment.js";

test("TieredActivationSegmentView shows the status in capitals", () => {
  const item = newTieredActivationSegment("code-337", "label-967");
  const view = toTieredActivationSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredActivationSegmentViews([item, item]).length, 2, "views");
});
