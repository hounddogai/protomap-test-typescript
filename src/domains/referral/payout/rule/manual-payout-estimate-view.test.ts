import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPayoutEstimateView, toManualPayoutEstimateViews } from "./manual-payout-estimate-view.js";
import { newManualPayoutEstimate } from "./manual-payout-estimate.js";

test("ManualPayoutEstimateView shows the status in capitals", () => {
  const item = newManualPayoutEstimate("code-564", "label-394");
  const view = toManualPayoutEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPayoutEstimateViews([item, item]).length, 2, "views");
});
