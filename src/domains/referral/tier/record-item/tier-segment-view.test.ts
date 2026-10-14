import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierSegmentView, toTierSegmentViews } from "./tier-segment-view.js";
import { newTierSegment } from "./tier-segment.js";

test("TierSegmentView shows the status in capitals", () => {
  const item = newTierSegment("code-713", "title-932");
  const view = toTierSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierSegmentViews([item, item]).length, 2, "views");
});
