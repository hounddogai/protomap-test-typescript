import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCreditEstimateView, toPendingCreditEstimateViews } from "./pending-credit-estimate-view.js";
import { newPendingCreditEstimate } from "./pending-credit-estimate.js";

test("PendingCreditEstimateView shows the status in capitals", () => {
  const item = newPendingCreditEstimate("code-355", "label-980");
  const view = toPendingCreditEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCreditEstimateViews([item, item]).length, 2, "views");
});
