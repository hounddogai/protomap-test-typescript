import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditClaimView, toCreditClaimViews } from "./credit-claim-view.js";
import { newCreditClaim } from "./credit-claim.js";

test("CreditClaimView shows the status in capitals", () => {
  const item = newCreditClaim("code-441", "name-366");
  const view = toCreditClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditClaimViews([item, item]).length, 2, "views");
});
