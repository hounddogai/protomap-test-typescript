import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCohortMilestoneStore } from "./rolling-cohort-milestone-store.js";
import { newRollingCohortMilestone } from "./rolling-cohort-milestone.js";

test("MemoryRollingCohortMilestoneStore finds what it saved", () => {
  const store = newMemoryRollingCohortMilestoneStore();
  const item = newRollingCohortMilestone("code-38", "title-624");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
