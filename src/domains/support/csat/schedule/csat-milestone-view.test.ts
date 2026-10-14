import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatMilestoneView, toCsatMilestoneViews } from "./csat-milestone-view.js";
import { newCsatMilestone } from "./csat-milestone.js";

test("CsatMilestoneView shows the status in capitals", () => {
  const item = newCsatMilestone("code-978", "title-208");
  const view = toCsatMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatMilestoneViews([item, item]).length, 2, "views");
});
