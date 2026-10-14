import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingWindowSlotStore } from "./pending-window-slot-store.js";
import { newPendingWindowSlot } from "./pending-window-slot.js";

test("MemoryPendingWindowSlotStore finds what it saved", () => {
  const store = newMemoryPendingWindowSlotStore();
  const item = newPendingWindowSlot("code-625", "name-631");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
