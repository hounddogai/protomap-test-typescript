import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditEstimateView, toCreditEstimateViews } from "./credit-estimate-view.js";
import { newCreditEstimate } from "./credit-estimate.js";

test("CreditEstimateView shows the status in capitals", () => {
  const item = newCreditEstimate("code-695", "title-391");
  const view = toCreditEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditEstimateViews([item, item]).length, 2, "views");
});
