import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaSegmentView, toSlaSegmentViews } from "./sla-segment-view.js";
import { newSlaSegment } from "./sla-segment.js";

test("SlaSegmentView shows the status in capitals", () => {
  const item = newSlaSegment("code-583", "title-688");
  const view = toSlaSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaSegmentViews([item, item]).length, 2, "views");
});
