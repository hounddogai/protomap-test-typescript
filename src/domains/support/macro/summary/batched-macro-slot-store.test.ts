import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedMacroSlotStore } from "./batched-macro-slot-store.js";
import { newBatchedMacroSlot } from "./batched-macro-slot.js";

test("MemoryBatchedMacroSlotStore finds what it saved", () => {
  const store = newMemoryBatchedMacroSlotStore();
  const item = newBatchedMacroSlot("code-853", "name-831");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
