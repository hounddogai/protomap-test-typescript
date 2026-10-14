import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredChallengeTierView, toTieredChallengeTierViews } from "./tiered-challenge-tier-view.js";
import { newTieredChallengeTier } from "./tiered-challenge-tier.js";

test("TieredChallengeTierView shows the status in capitals", () => {
  const item = newTieredChallengeTier("code-791", "name-634");
  const view = toTieredChallengeTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredChallengeTierViews([item, item]).length, 2, "views");
});
