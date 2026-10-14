import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyOptOutSegmentView, toLegacyOptOutSegmentViews } from "./legacy-opt-out-segment-view.js";
import { newLegacyOptOutSegment } from "./legacy-opt-out-segment.js";

test("LegacyOptOutSegmentView shows the status in capitals", () => {
  const item = newLegacyOptOutSegment("code-819", "label-345");
  const view = toLegacyOptOutSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyOptOutSegmentViews([item, item]).length, 2, "views");
});
