import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCsatClaimView, toRegionalCsatClaimViews } from "./regional-csat-claim-view.js";
import { newRegionalCsatClaim } from "./regional-csat-claim.js";

test("RegionalCsatClaimView shows the status in capitals", () => {
  const item = newRegionalCsatClaim("code-170", "name-675");
  const view = toRegionalCsatClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCsatClaimViews([item, item]).length, 2, "views");
});
