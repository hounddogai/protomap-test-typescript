import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCohortClaimView, toLegacyCohortClaimViews } from "./legacy-cohort-claim-view.js";
import { newLegacyCohortClaim } from "./legacy-cohort-claim.js";

test("LegacyCohortClaimView shows the status in capitals", () => {
  const item = newLegacyCohortClaim("code-193", "title-630");
  const view = toLegacyCohortClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCohortClaimViews([item, item]).length, 2, "views");
});
