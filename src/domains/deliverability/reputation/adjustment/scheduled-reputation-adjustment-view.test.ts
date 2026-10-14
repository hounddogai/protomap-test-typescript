import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledReputationAdjustmentView,
  toScheduledReputationAdjustmentViews,
} from "./scheduled-reputation-adjustment-view.js";
import { newScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

test("ScheduledReputationAdjustmentView shows the status in capitals", () => {
  const item = newScheduledReputationAdjustment("code-829", "title-679");
  const view = toScheduledReputationAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledReputationAdjustmentViews([item, item]).length, 2, "views");
});
