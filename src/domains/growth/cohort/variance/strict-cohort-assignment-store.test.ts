import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCohortAssignmentStore } from "./strict-cohort-assignment-store.js";
import { newStrictCohortAssignment } from "./strict-cohort-assignment.js";

test("MemoryStrictCohortAssignmentStore finds what it saved", () => {
  const store = newMemoryStrictCohortAssignmentStore();
  const item = newStrictCohortAssignment("code-768", "name-126");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
