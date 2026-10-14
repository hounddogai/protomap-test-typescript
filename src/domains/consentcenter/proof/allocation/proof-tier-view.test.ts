import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofTierView, toProofTierViews } from "./proof-tier-view.js";
import { newProofTier } from "./proof-tier.js";

test("ProofTierView shows the status in capitals", () => {
  const item = newProofTier("code-812", "title-82");
  const view = toProofTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofTierViews([item, item]).length, 2, "views");
});
