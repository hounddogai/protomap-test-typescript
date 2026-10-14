import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFraudCheckClaimView, toPrimaryFraudCheckClaimViews } from "./primary-fraud-check-claim-view.js";
import { newPrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

test("PrimaryFraudCheckClaimView shows the status in capitals", () => {
  const item = newPrimaryFraudCheckClaim("code-624", "label-100");
  const view = toPrimaryFraudCheckClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFraudCheckClaimViews([item, item]).length, 2, "views");
});
