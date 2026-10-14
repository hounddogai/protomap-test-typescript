import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditGroupView, toCreditGroupViews } from "./credit-group-view.js";
import { newCreditGroup } from "./credit-group.js";

test("CreditGroupView shows the status in capitals", () => {
  const item = newCreditGroup("code-89", "name-224");
  const view = toCreditGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditGroupViews([item, item]).length, 2, "views");
});
