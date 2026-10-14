import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatClaimView, toCsatClaimViews } from "./csat-claim-view.js";
import { newCsatClaim } from "./csat-claim.js";

test("CsatClaimView shows the status in capitals", () => {
  const item = newCsatClaim("code-117", "title-728");
  const view = toCsatClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatClaimViews([item, item]).length, 2, "views");
});
