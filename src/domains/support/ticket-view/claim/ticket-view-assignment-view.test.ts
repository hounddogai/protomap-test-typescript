import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewAssignmentView, toTicketViewAssignmentViews } from "./ticket-view-assignment-view.js";
import { newTicketViewAssignment } from "./ticket-view-assignment.js";

test("TicketViewAssignmentView shows the status in capitals", () => {
  const item = newTicketViewAssignment("code-989", "name-298");
  const view = toTicketViewAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewAssignmentViews([item, item]).length, 2, "views");
});
