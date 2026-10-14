import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredActivationSegmentStore } from "./tiered-activation-segment-store.js";
import { newTieredActivationSegment } from "./tiered-activation-segment.js";

test("MemoryTieredActivationSegmentStore finds what it saved", () => {
  const store = newMemoryTieredActivationSegmentStore();
  const item = newTieredActivationSegment("code-337", "label-967");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
