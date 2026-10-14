import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredStepSegmentStore } from "./tiered-step-segment-store.js";
import { newTieredStepSegment } from "./tiered-step-segment.js";

test("MemoryTieredStepSegmentStore finds what it saved", () => {
  const store = newMemoryTieredStepSegmentStore();
  const item = newTieredStepSegment("code-793", "label-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
