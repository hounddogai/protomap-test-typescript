import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyProofTierView, toLegacyProofTierViews } from "./legacy-proof-tier-view.js";
import { newLegacyProofTier } from "./legacy-proof-tier.js";

test("LegacyProofTierView shows the status in capitals", () => {
  const item = newLegacyProofTier("code-971", "label-819");
  const view = toLegacyProofTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyProofTierViews([item, item]).length, 2, "views");
});
