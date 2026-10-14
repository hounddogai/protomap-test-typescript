import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalFraudCheckClaimView, toSeasonalFraudCheckClaimViews } from "./seasonal-fraud-check-claim-view.js";
import { newSeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

test("SeasonalFraudCheckClaimView shows the status in capitals", () => {
  const item = newSeasonalFraudCheckClaim("code-832", "title-782");
  const view = toSeasonalFraudCheckClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalFraudCheckClaimViews([item, item]).length, 2, "views");
});
