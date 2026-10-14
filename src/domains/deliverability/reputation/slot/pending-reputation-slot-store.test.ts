import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingReputationSlotStore } from "./pending-reputation-slot-store.js";
import { newPendingReputationSlot } from "./pending-reputation-slot.js";

test("MemoryPendingReputationSlotStore finds what it saved", () => {
  const store = newMemoryPendingReputationSlotStore();
  const item = newPendingReputationSlot("code-591", "label-842");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
