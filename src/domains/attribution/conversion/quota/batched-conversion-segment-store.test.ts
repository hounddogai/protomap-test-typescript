import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedConversionSegmentStore } from "./batched-conversion-segment-store.js";
import { newBatchedConversionSegment } from "./batched-conversion-segment.js";

test("MemoryBatchedConversionSegmentStore finds what it saved", () => {
  const store = newMemoryBatchedConversionSegmentStore();
  const item = newBatchedConversionSegment("code-242", "label-482");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
