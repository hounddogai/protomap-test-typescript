import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalSlotStore } from "./approval-slot-store.js";
import { newApprovalSlot } from "./approval-slot.js";

test("MemoryApprovalSlotStore finds what it saved", () => {
  const store = newMemoryApprovalSlotStore();
  const item = newApprovalSlot("code-203", "name-518");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
