import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardEntryStore } from "./weighted-reward-entry-store.js";
import { newWeightedRewardEntry } from "./weighted-reward-entry.js";

test("MemoryWeightedRewardEntryStore finds what it saved", () => {
  const store = newMemoryWeightedRewardEntryStore();
  const item = newWeightedRewardEntry("code-921", "name-719");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
