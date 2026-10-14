import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalApprovalAdjustmentView,
  toSeasonalApprovalAdjustmentViews,
} from "./seasonal-approval-adjustment-view.js";
import { newSeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

test("SeasonalApprovalAdjustmentView shows the status in capitals", () => {
  const item = newSeasonalApprovalAdjustment("code-779", "name-514");
  const view = toSeasonalApprovalAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalApprovalAdjustmentViews([item, item]).length, 2, "views");
});
