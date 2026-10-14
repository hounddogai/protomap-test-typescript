import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualChallengeTierView, toManualChallengeTierViews } from "./manual-challenge-tier-view.js";
import { newManualChallengeTier } from "./manual-challenge-tier.js";

test("ManualChallengeTierView shows the status in capitals", () => {
  const item = newManualChallengeTier("code-422", "label-485");
  const view = toManualChallengeTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualChallengeTierViews([item, item]).length, 2, "views");
});
