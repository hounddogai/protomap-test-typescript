import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationAssignmentView, toEscalationAssignmentViews } from "./escalation-assignment-view.js";
import { newEscalationAssignment } from "./escalation-assignment.js";

test("EscalationAssignmentView shows the status in capitals", () => {
  const item = newEscalationAssignment("code-775", "title-273");
  const view = toEscalationAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationAssignmentViews([item, item]).length, 2, "views");
});
