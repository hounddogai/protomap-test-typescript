import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedExitRuleAssignmentStore } from "./batched-exit-rule-assignment-store.js";
import { newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

test("MemoryBatchedExitRuleAssignmentStore finds what it saved", () => {
  const store = newMemoryBatchedExitRuleAssignmentStore();
  const item = newBatchedExitRuleAssignment("code-472", "title-385");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
