import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveStreakClaimView, toAdaptiveStreakClaimViews } from "./adaptive-streak-claim-view.js";
import { newAdaptiveStreakClaim } from "./adaptive-streak-claim.js";

test("AdaptiveStreakClaimView shows the status in capitals", () => {
  const item = newAdaptiveStreakClaim("code-401", "label-317");
  const view = toAdaptiveStreakClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveStreakClaimViews([item, item]).length, 2, "views");
});
