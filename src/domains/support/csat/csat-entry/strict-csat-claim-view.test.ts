import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCsatClaimView, toStrictCsatClaimViews } from "./strict-csat-claim-view.js";
import { newStrictCsatClaim } from "./strict-csat-claim.js";

test("StrictCsatClaimView shows the status in capitals", () => {
  const item = newStrictCsatClaim("code-938", "label-429");
  const view = toStrictCsatClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCsatClaimViews([item, item]).length, 2, "views");
});
