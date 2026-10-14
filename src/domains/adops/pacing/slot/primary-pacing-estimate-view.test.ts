import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPacingEstimateView, toPrimaryPacingEstimateViews } from "./primary-pacing-estimate-view.js";
import { newPrimaryPacingEstimate } from "./primary-pacing-estimate.js";

test("PrimaryPacingEstimateView shows the status in capitals", () => {
  const item = newPrimaryPacingEstimate("code-907", "title-137");
  const view = toPrimaryPacingEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPacingEstimateViews([item, item]).length, 2, "views");
});
