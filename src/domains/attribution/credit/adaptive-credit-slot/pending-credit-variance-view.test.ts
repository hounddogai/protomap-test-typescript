import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCreditVarianceView, toPendingCreditVarianceViews } from "./pending-credit-variance-view.js";
import { newPendingCreditVariance } from "./pending-credit-variance.js";

test("PendingCreditVarianceView shows the status in capitals", () => {
  const item = newPendingCreditVariance("code-649", "label-839");
  const view = toPendingCreditVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCreditVarianceViews([item, item]).length, 2, "views");
});
