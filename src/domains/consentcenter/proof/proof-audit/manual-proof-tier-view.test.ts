import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualProofTierView, toManualProofTierViews } from "./manual-proof-tier-view.js";
import { newManualProofTier } from "./manual-proof-tier.js";

test("ManualProofTierView shows the status in capitals", () => {
  const item = newManualProofTier("code-25", "title-115");
  const view = toManualProofTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualProofTierViews([item, item]).length, 2, "views");
});
