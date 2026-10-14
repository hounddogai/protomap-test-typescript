import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalInsightAssignmentView,
  toSeasonalInsightAssignmentViews,
} from "./seasonal-insight-assignment-view.js";
import { newSeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

test("SeasonalInsightAssignmentView shows the status in capitals", () => {
  const item = newSeasonalInsightAssignment("code-802", "name-813");
  const view = toSeasonalInsightAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalInsightAssignmentViews([item, item]).length, 2, "views");
});
