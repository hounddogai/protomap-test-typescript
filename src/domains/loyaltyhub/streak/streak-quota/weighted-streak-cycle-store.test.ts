import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedStreakCycleStore } from "./weighted-streak-cycle-store.js";
import { newWeightedStreakCycle } from "./weighted-streak-cycle.js";

test("MemoryWeightedStreakCycleStore finds what it saved", () => {
  const store = newMemoryWeightedStreakCycleStore();
  const item = newWeightedStreakCycle("code-193", "label-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
