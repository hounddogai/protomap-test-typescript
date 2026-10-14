import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledInviteAllocationStore } from "./scheduled-invite-allocation-store.js";
import { newScheduledInviteAllocation } from "./scheduled-invite-allocation.js";

test("MemoryScheduledInviteAllocationStore finds what it saved", () => {
  const store = newMemoryScheduledInviteAllocationStore();
  const item = newScheduledInviteAllocation("code-552", "title-744");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
