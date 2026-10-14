import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentSlotStore } from "./enrollment-slot-store.js";
import { newEnrollmentSlot } from "./enrollment-slot.js";

test("MemoryEnrollmentSlotStore finds what it saved", () => {
  const store = newMemoryEnrollmentSlotStore();
  const item = newEnrollmentSlot("code-565", "title-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
