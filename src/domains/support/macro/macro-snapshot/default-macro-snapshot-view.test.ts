import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultMacroSnapshotView, toDefaultMacroSnapshotViews } from "./default-macro-snapshot-view.js";
import { newDefaultMacroSnapshot } from "./default-macro-snapshot.js";

test("DefaultMacroSnapshotView shows the status in capitals", () => {
  const item = newDefaultMacroSnapshot("code-152", "name-923");
  const view = toDefaultMacroSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultMacroSnapshotViews([item, item]).length, 2, "views");
});
