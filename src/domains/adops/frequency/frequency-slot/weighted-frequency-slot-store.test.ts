import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFrequencySlotStore } from "./weighted-frequency-slot-store.js";
import { newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

test("MemoryWeightedFrequencySlotStore finds what it saved", () => {
  const store = newMemoryWeightedFrequencySlotStore();
  const item = newWeightedFrequencySlot("code-513", "title-145");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
