import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackFraudCheckClaimView, toFallbackFraudCheckClaimViews } from "./fallback-fraud-check-claim-view.js";
import { newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

test("FallbackFraudCheckClaimView shows the status in capitals", () => {
  const item = newFallbackFraudCheckClaim("code-228", "title-892");
  const view = toFallbackFraudCheckClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFraudCheckClaimViews([item, item]).length, 2, "views");
});
