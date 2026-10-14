import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryMacroSnapshotView, toPrimaryMacroSnapshotViews } from "./primary-macro-snapshot-view.js";
import { newPrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

test("PrimaryMacroSnapshotView shows the status in capitals", () => {
  const item = newPrimaryMacroSnapshot("code-847", "name-230");
  const view = toPrimaryMacroSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryMacroSnapshotViews([item, item]).length, 2, "views");
});
