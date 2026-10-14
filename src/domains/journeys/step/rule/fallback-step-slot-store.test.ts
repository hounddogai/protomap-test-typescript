import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackStepSlotStore } from "./fallback-step-slot-store.js";
import { newFallbackStepSlot } from "./fallback-step-slot.js";

test("MemoryFallbackStepSlotStore finds what it saved", () => {
  const store = newMemoryFallbackStepSlotStore();
  const item = newFallbackStepSlot("code-534", "name-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
