import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalTierEntryView, toGlobalTierEntryViews } from "./global-tier-entry-view.js";
import { newGlobalTierEntry } from "./global-tier-entry.js";

test("GlobalTierEntryView shows the status in capitals", () => {
  const item = newGlobalTierEntry("code-637", "title-318");
  const view = toGlobalTierEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalTierEntryViews([item, item]).length, 2, "views");
});
