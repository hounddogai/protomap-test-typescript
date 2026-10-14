import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingInviteSlotStore } from "./pending-invite-slot-store.js";
import { newPendingInviteSlot } from "./pending-invite-slot.js";

test("MemoryPendingInviteSlotStore finds what it saved", () => {
  const store = newMemoryPendingInviteSlotStore();
  const item = newPendingInviteSlot("code-759", "title-762");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
