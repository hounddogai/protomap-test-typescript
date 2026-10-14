import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencySlotStore } from "./frequency-slot-store.js";
import { newFrequencySlot } from "./frequency-slot.js";

test("MemoryFrequencySlotStore finds what it saved", () => {
  const store = newMemoryFrequencySlotStore();
  const item = newFrequencySlot("code-820", "label-403");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
