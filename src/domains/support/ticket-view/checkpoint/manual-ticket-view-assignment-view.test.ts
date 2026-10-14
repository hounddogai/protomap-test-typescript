import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualTicketViewAssignmentView,
  toManualTicketViewAssignmentViews,
} from "./manual-ticket-view-assignment-view.js";
import { newManualTicketViewAssignment } from "./manual-ticket-view-assignment.js";

test("ManualTicketViewAssignmentView shows the status in capitals", () => {
  const item = newManualTicketViewAssignment("code-876", "title-252");
  const view = toManualTicketViewAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTicketViewAssignmentViews([item, item]).length, 2, "views");
});
