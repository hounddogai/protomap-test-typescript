import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBranchTierView, toLegacyBranchTierViews } from "./legacy-branch-tier-view.js";
import { newLegacyBranchTier } from "./legacy-branch-tier.js";

test("LegacyBranchTierView shows the status in capitals", () => {
  const item = newLegacyBranchTier("code-46", "title-495");
  const view = toLegacyBranchTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBranchTierViews([item, item]).length, 2, "views");
});
