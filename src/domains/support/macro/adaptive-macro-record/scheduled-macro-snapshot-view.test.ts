import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledMacroSnapshotView, toScheduledMacroSnapshotViews } from "./scheduled-macro-snapshot-view.js";
import { newScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

test("ScheduledMacroSnapshotView shows the status in capitals", () => {
  const item = newScheduledMacroSnapshot("code-64", "label-592");
  const view = toScheduledMacroSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledMacroSnapshotViews([item, item]).length, 2, "views");
});
