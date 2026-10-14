import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedReputationAdjustmentView,
  toWeightedReputationAdjustmentViews,
} from "./weighted-reputation-adjustment-view.js";
import { newWeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

test("WeightedReputationAdjustmentView shows the status in capitals", () => {
  const item = newWeightedReputationAdjustment("code-679", "name-89");
  const view = toWeightedReputationAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedReputationAdjustmentViews([item, item]).length, 2, "views");
});
