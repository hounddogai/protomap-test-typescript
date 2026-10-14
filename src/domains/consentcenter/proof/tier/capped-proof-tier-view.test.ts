import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedProofTierView, toCappedProofTierViews } from "./capped-proof-tier-view.js";
import { newCappedProofTier } from "./capped-proof-tier.js";

test("CappedProofTierView shows the status in capitals", () => {
  const item = newCappedProofTier("code-882", "title-921");
  const view = toCappedProofTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedProofTierViews([item, item]).length, 2, "views");
});
