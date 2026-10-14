import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedChallengeSlotStore } from "./weighted-challenge-slot-store.js";
import { newWeightedChallengeSlot } from "./weighted-challenge-slot.js";

test("MemoryWeightedChallengeSlotStore finds what it saved", () => {
  const store = newMemoryWeightedChallengeSlotStore();
  const item = newWeightedChallengeSlot("code-234", "label-895");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
