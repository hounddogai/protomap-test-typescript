import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalEnrollmentSlotStore } from "./global-enrollment-slot-store.js";
import { newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

test("MemoryGlobalEnrollmentSlotStore finds what it saved", () => {
  const store = newMemoryGlobalEnrollmentSlotStore();
  const item = newGlobalEnrollmentSlot("code-857", "title-273");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
