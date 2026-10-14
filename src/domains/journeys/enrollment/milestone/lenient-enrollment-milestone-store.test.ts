import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientEnrollmentMilestoneStore } from "./lenient-enrollment-milestone-store.js";
import { newLenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

test("MemoryLenientEnrollmentMilestoneStore finds what it saved", () => {
  const store = newMemoryLenientEnrollmentMilestoneStore();
  const item = newLenientEnrollmentMilestone("code-748", "label-869");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
