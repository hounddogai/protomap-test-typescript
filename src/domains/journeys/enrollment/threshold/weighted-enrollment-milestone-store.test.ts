import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEnrollmentMilestoneStore } from "./weighted-enrollment-milestone-store.js";
import { newWeightedEnrollmentMilestone } from "./weighted-enrollment-milestone.js";

test("MemoryWeightedEnrollmentMilestoneStore finds what it saved", () => {
  const store = newMemoryWeightedEnrollmentMilestoneStore();
  const item = newWeightedEnrollmentMilestone("code-388", "name-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
