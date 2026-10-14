import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCsatCycleStore } from "./weighted-csat-cycle-store.js";
import { newWeightedCsatCycle } from "./weighted-csat-cycle.js";

test("MemoryWeightedCsatCycleStore finds what it saved", () => {
  const store = newMemoryWeightedCsatCycleStore();
  const item = newWeightedCsatCycle("code-77", "name-975");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
