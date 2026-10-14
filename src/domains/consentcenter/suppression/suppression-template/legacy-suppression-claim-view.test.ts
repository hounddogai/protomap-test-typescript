import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySuppressionClaimView, toLegacySuppressionClaimViews } from "./legacy-suppression-claim-view.js";
import { newLegacySuppressionClaim } from "./legacy-suppression-claim.js";

test("LegacySuppressionClaimView shows the status in capitals", () => {
  const item = newLegacySuppressionClaim("code-840", "name-829");
  const view = toLegacySuppressionClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySuppressionClaimViews([item, item]).length, 2, "views");
});
