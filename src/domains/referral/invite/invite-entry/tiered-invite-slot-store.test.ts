import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredInviteSlotStore } from "./tiered-invite-slot-store.js";
import { newTieredInviteSlot } from "./tiered-invite-slot.js";

test("MemoryTieredInviteSlotStore finds what it saved", () => {
  const store = newMemoryTieredInviteSlotStore();
  const item = newTieredInviteSlot("code-105", "label-86");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
