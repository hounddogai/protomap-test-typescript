import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionSegmentView, toRetentionSegmentViews } from "./retention-segment-view.js";
import { newRetentionSegment } from "./retention-segment.js";

test("RetentionSegmentView shows the status in capitals", () => {
  const item = newRetentionSegment("code-92", "name-532");
  const view = toRetentionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionSegmentViews([item, item]).length, 2, "views");
});
