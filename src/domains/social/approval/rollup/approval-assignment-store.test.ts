import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalAssignmentStore } from "./approval-assignment-store.js";
import { newApprovalAssignment } from "./approval-assignment.js";

test("MemoryApprovalAssignmentStore finds what it saved", () => {
  const store = newMemoryApprovalAssignmentStore();
  const item = newApprovalAssignment("code-61", "title-716");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
