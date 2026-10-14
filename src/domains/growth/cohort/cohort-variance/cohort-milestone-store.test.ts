import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortMilestoneStore } from "./cohort-milestone-store.js";
import { newCohortMilestone } from "./cohort-milestone.js";

test("MemoryCohortMilestoneStore finds what it saved", () => {
  const store = newMemoryCohortMilestoneStore();
  const item = newCohortMilestone("code-996", "name-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
