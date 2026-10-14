import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPostThresholdStore } from "./tiered-post-threshold-store.js";
import { newTieredPostThreshold } from "./tiered-post-threshold.js";

test("MemoryTieredPostThresholdStore finds what it saved", () => {
  const store = newMemoryTieredPostThresholdStore();
  const item = newTieredPostThreshold("code-594", "title-621");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
