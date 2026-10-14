import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditBaselineView, toCreditBaselineViews } from "./credit-baseline-view.js";
import { newCreditBaseline } from "./credit-baseline.js";

test("CreditBaselineView shows the status in capitals", () => {
  const item = newCreditBaseline("code-205", "label-573");
  const view = toCreditBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditBaselineViews([item, item]).length, 2, "views");
});
