import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyTicketViewAssignmentView,
  toLegacyTicketViewAssignmentViews,
} from "./legacy-ticket-view-assignment-view.js";
import { newLegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

test("LegacyTicketViewAssignmentView shows the status in capitals", () => {
  const item = newLegacyTicketViewAssignment("code-626", "name-280");
  const view = toLegacyTicketViewAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTicketViewAssignmentViews([item, item]).length, 2, "views");
});
