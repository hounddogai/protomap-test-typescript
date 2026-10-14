import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryBadgeEntryView, toPrimaryBadgeEntryViews } from "./primary-badge-entry-view.js";
import { newPrimaryBadgeEntry } from "./primary-badge-entry.js";

test("PrimaryBadgeEntryView shows the status in capitals", () => {
  const item = newPrimaryBadgeEntry("code-407", "label-560");
  const view = toPrimaryBadgeEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryBadgeEntryViews([item, item]).length, 2, "views");
});
