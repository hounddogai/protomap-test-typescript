import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredStepMilestoneStore } from "./tiered-step-milestone-store.js";
import { newTieredStepMilestone } from "./tiered-step-milestone.js";

test("MemoryTieredStepMilestoneStore finds what it saved", () => {
  const store = newMemoryTieredStepMilestoneStore();
  const item = newTieredStepMilestone("code-44", "title-752");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
