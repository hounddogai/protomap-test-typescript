import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredInsightAssignmentView, toTieredInsightAssignmentViews } from "./tiered-insight-assignment-view.js";
import { newTieredInsightAssignment } from "./tiered-insight-assignment.js";

test("TieredInsightAssignmentView shows the status in capitals", () => {
  const item = newTieredInsightAssignment("code-758", "title-883");
  const view = toTieredInsightAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredInsightAssignmentViews([item, item]).length, 2, "views");
});
