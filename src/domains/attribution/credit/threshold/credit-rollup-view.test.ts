import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditRollupView, toCreditRollupViews } from "./credit-rollup-view.js";
import { newCreditRollup } from "./credit-rollup.js";

test("CreditRollupView shows the status in capitals", () => {
  const item = newCreditRollup("code-851", "title-109");
  const view = toCreditRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditRollupViews([item, item]).length, 2, "views");
});
