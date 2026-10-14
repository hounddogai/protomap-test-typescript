import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedRetentionSegmentView, toBatchedRetentionSegmentViews } from "./batched-retention-segment-view.js";
import { newBatchedRetentionSegment } from "./batched-retention-segment.js";

test("BatchedRetentionSegmentView shows the status in capitals", () => {
  const item = newBatchedRetentionSegment("code-350", "name-429");
  const view = toBatchedRetentionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedRetentionSegmentViews([item, item]).length, 2, "views");
});
