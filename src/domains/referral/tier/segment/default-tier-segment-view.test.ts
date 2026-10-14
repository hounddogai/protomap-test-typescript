import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultTierSegmentView, toDefaultTierSegmentViews } from "./default-tier-segment-view.js";
import { newDefaultTierSegment } from "./default-tier-segment.js";

test("DefaultTierSegmentView shows the status in capitals", () => {
  const item = newDefaultTierSegment("code-38", "label-149");
  const view = toDefaultTierSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultTierSegmentViews([item, item]).length, 2, "views");
});
