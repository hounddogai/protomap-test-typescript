import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalEscalationEstimateView,
  toRegionalEscalationEstimateViews,
} from "./regional-escalation-estimate-view.js";
import { newRegionalEscalationEstimate } from "./regional-escalation-estimate.js";

test("RegionalEscalationEstimateView shows the status in capitals", () => {
  const item = newRegionalEscalationEstimate("code-401", "name-515");
  const view = toRegionalEscalationEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalEscalationEstimateViews([item, item]).length, 2, "views");
});
