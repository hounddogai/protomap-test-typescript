import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEnrollmentSlotStore } from "./weighted-enrollment-slot-store.js";
import { newWeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

test("MemoryWeightedEnrollmentSlotStore finds what it saved", () => {
  const store = newMemoryWeightedEnrollmentSlotStore();
  const item = newWeightedEnrollmentSlot("code-204", "title-774");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
