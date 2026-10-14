import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortAdjustmentView, toCohortAdjustmentViews } from "./cohort-adjustment-view.js";
import { newCohortAdjustment } from "./cohort-adjustment.js";

test("CohortAdjustmentView shows the status in capitals", () => {
  const item = newCohortAdjustment("code-698", "name-479");
  const view = toCohortAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortAdjustmentViews([item, item]).length, 2, "views");
});
