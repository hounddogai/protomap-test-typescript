import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCreditSlotStore } from "./weighted-credit-slot-store.js";
import { newWeightedCreditSlot } from "./weighted-credit-slot.js";

test("MemoryWeightedCreditSlotStore finds what it saved", () => {
  const store = newMemoryWeightedCreditSlotStore();
  const item = newWeightedCreditSlot("code-870", "name-437");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
