import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyTierView, toJourneyTierViews } from "./journey-tier-view.js";
import { newJourneyTier } from "./journey-tier.js";

test("JourneyTierView shows the status in capitals", () => {
  const item = newJourneyTier("code-94", "name-140");
  const view = toJourneyTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyTierViews([item, item]).length, 2, "views");
});
