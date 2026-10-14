import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredMacroSnapshotView, toTieredMacroSnapshotViews } from "./tiered-macro-snapshot-view.js";
import { newTieredMacroSnapshot } from "./tiered-macro-snapshot.js";

test("TieredMacroSnapshotView shows the status in capitals", () => {
  const item = newTieredMacroSnapshot("code-450", "name-767");
  const view = toTieredMacroSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredMacroSnapshotViews([item, item]).length, 2, "views");
});
