import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortSlotStore } from "./cohort-slot-store.js";
import { newCohortSlot } from "./cohort-slot.js";

test("MemoryCohortSlotStore finds what it saved", () => {
  const store = newMemoryCohortSlotStore();
  const item = newCohortSlot("code-362", "label-838");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
