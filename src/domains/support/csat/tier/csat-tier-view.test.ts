import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatTierView, toCsatTierViews } from "./csat-tier-view.js";
import { newCsatTier } from "./csat-tier.js";

test("CsatTierView shows the status in capitals", () => {
  const item = newCsatTier("code-759", "title-401");
  const view = toCsatTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatTierViews([item, item]).length, 2, "views");
});
