import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredLevelClaimView, toTieredLevelClaimViews } from "./tiered-level-claim-view.js";
import { newTieredLevelClaim } from "./tiered-level-claim.js";

test("TieredLevelClaimView shows the status in capitals", () => {
  const item = newTieredLevelClaim("code-42", "title-30");
  const view = toTieredLevelClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredLevelClaimViews([item, item]).length, 2, "views");
});
