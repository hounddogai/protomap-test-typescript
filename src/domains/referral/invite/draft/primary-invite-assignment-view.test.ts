import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryInviteAssignmentView, toPrimaryInviteAssignmentViews } from "./primary-invite-assignment-view.js";
import { newPrimaryInviteAssignment } from "./primary-invite-assignment.js";

test("PrimaryInviteAssignmentView shows the status in capitals", () => {
  const item = newPrimaryInviteAssignment("code-998", "label-836");
  const view = toPrimaryInviteAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryInviteAssignmentViews([item, item]).length, 2, "views");
});
