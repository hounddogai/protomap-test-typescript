import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRetentionSegmentStore } from "./batched-retention-segment-store.js";
import { newBatchedRetentionSegment } from "./batched-retention-segment.js";

test("MemoryBatchedRetentionSegmentStore finds what it saved", () => {
  const store = newMemoryBatchedRetentionSegmentStore();
  const item = newBatchedRetentionSegment("code-350", "name-429");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
