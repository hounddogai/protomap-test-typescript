import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyTierEntryView, toLegacyTierEntryViews } from "./legacy-tier-entry-view.js";
import { newLegacyTierEntry } from "./legacy-tier-entry.js";

test("LegacyTierEntryView shows the status in capitals", () => {
  const item = newLegacyTierEntry("code-922", "title-513");
  const view = toLegacyTierEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTierEntryViews([item, item]).length, 2, "views");
});
