import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualLevelEntryView, toManualLevelEntryViews } from "./manual-level-entry-view.js";
import { newManualLevelEntry } from "./manual-level-entry.js";

test("ManualLevelEntryView shows the status in capitals", () => {
  const item = newManualLevelEntry("code-163", "label-508");
  const view = toManualLevelEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLevelEntryViews([item, item]).length, 2, "views");
});
