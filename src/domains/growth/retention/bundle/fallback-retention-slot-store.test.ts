import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackRetentionSlotStore } from "./fallback-retention-slot-store.js";
import { newFallbackRetentionSlot } from "./fallback-retention-slot.js";

test("MemoryFallbackRetentionSlotStore finds what it saved", () => {
  const store = newMemoryFallbackRetentionSlotStore();
  const item = newFallbackRetentionSlot("code-662", "name-118");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
