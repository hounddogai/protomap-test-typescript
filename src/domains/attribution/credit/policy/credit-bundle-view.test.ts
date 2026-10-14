import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditBundleView, toCreditBundleViews } from "./credit-bundle-view.js";
import { newCreditBundle } from "./credit-bundle.js";

test("CreditBundleView shows the status in capitals", () => {
  const item = newCreditBundle("code-87", "title-733");
  const view = toCreditBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditBundleViews([item, item]).length, 2, "views");
});
