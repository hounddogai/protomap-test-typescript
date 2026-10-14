import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortAssignmentStore } from "./cohort-assignment-store.js";
import { newCohortAssignment } from "./cohort-assignment.js";

test("MemoryCohortAssignmentStore finds what it saved", () => {
  const store = newMemoryCohortAssignmentStore();
  const item = newCohortAssignment("code-806", "name-203");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
