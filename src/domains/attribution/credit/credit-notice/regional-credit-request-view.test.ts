import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCreditRequestView, toRegionalCreditRequestViews } from "./regional-credit-request-view.js";
import { newRegionalCreditRequest } from "./regional-credit-request.js";

test("RegionalCreditRequestView shows the status in capitals", () => {
  const item = newRegionalCreditRequest("code-520", "name-937");
  const view = toRegionalCreditRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCreditRequestViews([item, item]).length, 2, "views");
});
