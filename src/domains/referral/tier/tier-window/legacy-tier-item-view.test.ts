import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyTierItemView, toLegacyTierItemViews } from "./legacy-tier-item-view.js";
import { newLegacyTierItem } from "./legacy-tier-item.js";

test("LegacyTierItemView shows the status in capitals", () => {
  const item = newLegacyTierItem("code-288", "title-633");
  const view = toLegacyTierItemView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTierItemViews([item, item]).length, 2, "views");
});
