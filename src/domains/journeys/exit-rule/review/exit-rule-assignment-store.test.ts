import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleAssignmentStore } from "./exit-rule-assignment-store.js";
import { newExitRuleAssignment } from "./exit-rule-assignment.js";

test("MemoryExitRuleAssignmentStore finds what it saved", () => {
  const store = newMemoryExitRuleAssignmentStore();
  const item = newExitRuleAssignment("code-4", "title-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
