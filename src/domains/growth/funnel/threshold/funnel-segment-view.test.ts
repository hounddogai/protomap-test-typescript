import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelSegmentView, toFunnelSegmentViews } from "./funnel-segment-view.js";
import { newFunnelSegment } from "./funnel-segment.js";

test("FunnelSegmentView shows the status in capitals", () => {
  const item = newFunnelSegment("code-38", "label-907");
  const view = toFunnelSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelSegmentViews([item, item]).length, 2, "views");
});
