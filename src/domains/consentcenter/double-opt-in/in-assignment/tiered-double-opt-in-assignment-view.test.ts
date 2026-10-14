import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredDoubleOptInAssignmentView,
  toTieredDoubleOptInAssignmentViews,
} from "./tiered-double-opt-in-assignment-view.js";
import { newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

test("TieredDoubleOptInAssignmentView shows the status in capitals", () => {
  const item = newTieredDoubleOptInAssignment("code-27", "name-576");
  const view = toTieredDoubleOptInAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDoubleOptInAssignmentViews([item, item]).length, 2, "views");
});
