import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentMilestoneStore } from "./enrollment-milestone-store.js";
import { newEnrollmentMilestone } from "./enrollment-milestone.js";

test("MemoryEnrollmentMilestoneStore finds what it saved", () => {
  const store = newMemoryEnrollmentMilestoneStore();
  const item = newEnrollmentMilestone("code-197", "label-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
