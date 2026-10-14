import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelAssignmentView, toFunnelAssignmentViews } from "./funnel-assignment-view.js";
import { newFunnelAssignment } from "./funnel-assignment.js";

test("FunnelAssignmentView shows the status in capitals", () => {
  const item = newFunnelAssignment("code-560", "title-610");
  const view = toFunnelAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelAssignmentViews([item, item]).length, 2, "views");
});
