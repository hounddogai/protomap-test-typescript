import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalBranchAssignmentStore } from "./global-branch-assignment-store.js";
import { newGlobalBranchAssignment } from "./global-branch-assignment.js";

test("MemoryGlobalBranchAssignmentStore finds what it saved", () => {
  const store = newMemoryGlobalBranchAssignmentStore();
  const item = newGlobalBranchAssignment("code-993", "name-587");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
