import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainAssignmentView, toDomainAssignmentViews } from "./domain-assignment-view.js";
import { newDomainAssignment } from "./domain-assignment.js";

test("DomainAssignmentView shows the status in capitals", () => {
  const item = newDomainAssignment("code-792", "label-259");
  const view = toDomainAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainAssignmentViews([item, item]).length, 2, "views");
});
