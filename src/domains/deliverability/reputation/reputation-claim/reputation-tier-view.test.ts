import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationTierView, toReputationTierViews } from "./reputation-tier-view.js";
import { newReputationTier } from "./reputation-tier.js";

test("ReputationTierView shows the status in capitals", () => {
  const item = newReputationTier("code-750", "title-787");
  const view = toReputationTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationTierViews([item, item]).length, 2, "views");
});
