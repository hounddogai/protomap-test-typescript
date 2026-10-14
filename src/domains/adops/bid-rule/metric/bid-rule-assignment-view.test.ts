import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleAssignmentView, toBidRuleAssignmentViews } from "./bid-rule-assignment-view.js";
import { newBidRuleAssignment } from "./bid-rule-assignment.js";

test("BidRuleAssignmentView shows the status in capitals", () => {
  const item = newBidRuleAssignment("code-795", "title-674");
  const view = toBidRuleAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleAssignmentViews([item, item]).length, 2, "views");
});
