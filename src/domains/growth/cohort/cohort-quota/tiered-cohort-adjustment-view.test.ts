import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCohortAdjustmentView, toTieredCohortAdjustmentViews } from "./tiered-cohort-adjustment-view.js";
import { newTieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

test("TieredCohortAdjustmentView shows the status in capitals", () => {
  const item = newTieredCohortAdjustment("code-301", "name-698");
  const view = toTieredCohortAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCohortAdjustmentViews([item, item]).length, 2, "views");
});
