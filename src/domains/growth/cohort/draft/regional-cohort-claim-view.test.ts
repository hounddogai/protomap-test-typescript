import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCohortClaimView, toRegionalCohortClaimViews } from "./regional-cohort-claim-view.js";
import { newRegionalCohortClaim } from "./regional-cohort-claim.js";

test("RegionalCohortClaimView shows the status in capitals", () => {
  const item = newRegionalCohortClaim("code-858", "title-911");
  const view = toRegionalCohortClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCohortClaimViews([item, item]).length, 2, "views");
});
