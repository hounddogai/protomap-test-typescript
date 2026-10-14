import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalApprovalSlotStore } from "./regional-approval-slot-store.js";
import { newRegionalApprovalSlot } from "./regional-approval-slot.js";

test("MemoryRegionalApprovalSlotStore finds what it saved", () => {
  const store = newMemoryRegionalApprovalSlotStore();
  const item = newRegionalApprovalSlot("code-791", "label-915");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
