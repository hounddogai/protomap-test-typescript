import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientEnrollmentSlotStore } from "./lenient-enrollment-slot-store.js";
import { newLenientEnrollmentSlot } from "./lenient-enrollment-slot.js";

test("MemoryLenientEnrollmentSlotStore finds what it saved", () => {
  const store = newMemoryLenientEnrollmentSlotStore();
  const item = newLenientEnrollmentSlot("code-956", "name-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
