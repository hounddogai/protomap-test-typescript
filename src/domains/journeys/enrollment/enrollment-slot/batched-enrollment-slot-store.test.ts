import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedEnrollmentSlotStore } from "./batched-enrollment-slot-store.js";
import { newBatchedEnrollmentSlot } from "./batched-enrollment-slot.js";

test("MemoryBatchedEnrollmentSlotStore finds what it saved", () => {
  const store = newMemoryBatchedEnrollmentSlotStore();
  const item = newBatchedEnrollmentSlot("code-825", "label-610");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
