import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditRequestView, toCreditRequestViews } from "./credit-request-view.js";
import { newCreditRequest } from "./credit-request.js";

test("CreditRequestView shows the status in capitals", () => {
  const item = newCreditRequest("code-320", "label-517");
  const view = toCreditRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditRequestViews([item, item]).length, 2, "views");
});
