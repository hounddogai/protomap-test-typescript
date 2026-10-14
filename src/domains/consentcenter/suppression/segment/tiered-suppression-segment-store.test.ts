import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSuppressionSegmentStore } from "./tiered-suppression-segment-store.js";
import { newTieredSuppressionSegment } from "./tiered-suppression-segment.js";

test("MemoryTieredSuppressionSegmentStore finds what it saved", () => {
  const store = newMemoryTieredSuppressionSegmentStore();
  const item = newTieredSuppressionSegment("code-842", "name-655");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
