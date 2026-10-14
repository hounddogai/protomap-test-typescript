import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditPolicyView, toCreditPolicyViews } from "./credit-policy-view.js";
import { newCreditPolicy } from "./credit-policy.js";

test("CreditPolicyView shows the status in capitals", () => {
  const item = newCreditPolicy("code-357", "name-248");
  const view = toCreditPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditPolicyViews([item, item]).length, 2, "views");
});
