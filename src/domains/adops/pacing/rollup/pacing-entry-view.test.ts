import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingEntryView, toPacingEntryViews } from "./pacing-entry-view.js";
import { newPacingEntry } from "./pacing-entry.js";

test("PacingEntryView shows the status in capitals", () => {
  const item = newPacingEntry("code-831", "label-572");
  const view = toPacingEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingEntryViews([item, item]).length, 2, "views");
});
