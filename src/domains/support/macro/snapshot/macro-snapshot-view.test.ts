import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroSnapshotView, toMacroSnapshotViews } from "./macro-snapshot-view.js";
import { newMacroSnapshot } from "./macro-snapshot.js";

test("MacroSnapshotView shows the status in capitals", () => {
  const item = newMacroSnapshot("code-474", "title-37");
  const view = toMacroSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroSnapshotViews([item, item]).length, 2, "views");
});
