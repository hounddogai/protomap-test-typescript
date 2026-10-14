import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedReputationMilestoneStore } from "./weighted-reputation-milestone-store.js";
import { newWeightedReputationMilestone } from "./weighted-reputation-milestone.js";

test("MemoryWeightedReputationMilestoneStore finds what it saved", () => {
  const store = newMemoryWeightedReputationMilestoneStore();
  const item = newWeightedReputationMilestone("code-35", "name-79");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
