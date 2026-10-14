import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySenderEntryView, toLegacySenderEntryViews } from "./legacy-sender-entry-view.js";
import { newLegacySenderEntry } from "./legacy-sender-entry.js";

test("LegacySenderEntryView shows the status in capitals", () => {
  const item = newLegacySenderEntry("code-964", "title-360");
  const view = toLegacySenderEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySenderEntryViews([item, item]).length, 2, "views");
});
