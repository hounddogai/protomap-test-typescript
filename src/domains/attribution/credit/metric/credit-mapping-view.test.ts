import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditMappingView, toCreditMappingViews } from "./credit-mapping-view.js";
import { newCreditMapping } from "./credit-mapping.js";

test("CreditMappingView shows the status in capitals", () => {
  const item = newCreditMapping("code-102", "name-173");
  const view = toCreditMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditMappingViews([item, item]).length, 2, "views");
});
