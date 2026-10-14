import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRetentionSlotStore } from "./weighted-retention-slot-store.js";
import { newWeightedRetentionSlot } from "./weighted-retention-slot.js";

test("MemoryWeightedRetentionSlotStore finds what it saved", () => {
  const store = newMemoryWeightedRetentionSlotStore();
  const item = newWeightedRetentionSlot("code-412", "label-784");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
