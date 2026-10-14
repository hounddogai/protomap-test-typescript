import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualStreakTierView, toManualStreakTierViews } from "./manual-streak-tier-view.js";
import { newManualStreakTier } from "./manual-streak-tier.js";

test("ManualStreakTierView shows the status in capitals", () => {
  const item = newManualStreakTier("code-263", "name-48");
  const view = toManualStreakTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualStreakTierViews([item, item]).length, 2, "views");
});
