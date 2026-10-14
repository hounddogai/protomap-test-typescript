import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWarmupClaimView, toTieredWarmupClaimViews } from "./tiered-warmup-claim-view.js";
import { newTieredWarmupClaim } from "./tiered-warmup-claim.js";

test("TieredWarmupClaimView shows the status in capitals", () => {
  const item = newTieredWarmupClaim("code-227", "label-176");
  const view = toTieredWarmupClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWarmupClaimViews([item, item]).length, 2, "views");
});
