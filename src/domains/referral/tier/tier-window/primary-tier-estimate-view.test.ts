import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryTierEstimateView, toPrimaryTierEstimateViews } from "./primary-tier-estimate-view.js";
import { newPrimaryTierEstimate } from "./primary-tier-estimate.js";

test("PrimaryTierEstimateView shows the status in capitals", () => {
  const item = newPrimaryTierEstimate("code-224", "label-568");
  const view = toPrimaryTierEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryTierEstimateViews([item, item]).length, 2, "views");
});
