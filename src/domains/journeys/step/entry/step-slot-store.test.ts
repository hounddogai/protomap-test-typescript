import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepSlotStore } from "./step-slot-store.js";
import { newStepSlot } from "./step-slot.js";

test("MemoryStepSlotStore finds what it saved", () => {
  const store = newMemoryStepSlotStore();
  const item = newStepSlot("code-407", "name-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
