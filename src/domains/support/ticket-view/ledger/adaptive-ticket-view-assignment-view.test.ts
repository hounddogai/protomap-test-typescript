import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveTicketViewAssignmentView,
  toAdaptiveTicketViewAssignmentViews,
} from "./adaptive-ticket-view-assignment-view.js";
import { newAdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

test("AdaptiveTicketViewAssignmentView shows the status in capitals", () => {
  const item = newAdaptiveTicketViewAssignment("code-472", "name-883");
  const view = toAdaptiveTicketViewAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveTicketViewAssignmentViews([item, item]).length, 2, "views");
});
