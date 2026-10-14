import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPlacementEntryView, toManualPlacementEntryViews } from "./manual-placement-entry-view.js";
import { newManualPlacementEntry } from "./manual-placement-entry.js";

test("ManualPlacementEntryView shows the status in capitals", () => {
  const item = newManualPlacementEntry("code-369", "title-761");
  const view = toManualPlacementEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPlacementEntryViews([item, item]).length, 2, "views");
});
