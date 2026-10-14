import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedExitRuleAssignmentView,
  toBatchedExitRuleAssignmentViews,
} from "./batched-exit-rule-assignment-view.js";
import { newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

test("BatchedExitRuleAssignmentView shows the status in capitals", () => {
  const item = newBatchedExitRuleAssignment("code-472", "title-385");
  const view = toBatchedExitRuleAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedExitRuleAssignmentViews([item, item]).length, 2, "views");
});
