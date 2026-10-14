import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalProofClaimView, toSeasonalProofClaimViews } from "./seasonal-proof-claim-view.js";
import { newSeasonalProofClaim } from "./seasonal-proof-claim.js";

test("SeasonalProofClaimView shows the status in capitals", () => {
  const item = newSeasonalProofClaim("code-829", "title-819");
  const view = toSeasonalProofClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalProofClaimViews([item, item]).length, 2, "views");
});
