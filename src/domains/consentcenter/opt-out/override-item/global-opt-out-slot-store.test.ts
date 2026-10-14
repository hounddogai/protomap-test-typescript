import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalOptOutSlotStore } from "./global-opt-out-slot-store.js";
import { newGlobalOptOutSlot } from "./global-opt-out-slot.js";

test("MemoryGlobalOptOutSlotStore finds what it saved", () => {
  const store = newMemoryGlobalOptOutSlotStore();
  const item = newGlobalOptOutSlot("code-241", "name-808");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
