import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredStreakClaimView, toTieredStreakClaimViews } from "./tiered-streak-claim-view.js";
import { newTieredStreakClaim } from "./tiered-streak-claim.js";

test("TieredStreakClaimView shows the status in capitals", () => {
  const item = newTieredStreakClaim("code-575", "title-690");
  const view = toTieredStreakClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredStreakClaimViews([item, item]).length, 2, "views");
});
