import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackMacroSnapshotView, toFallbackMacroSnapshotViews } from "./fallback-macro-snapshot-view.js";
import { newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

test("FallbackMacroSnapshotView shows the status in capitals", () => {
  const item = newFallbackMacroSnapshot("code-276", "name-545");
  const view = toFallbackMacroSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackMacroSnapshotViews([item, item]).length, 2, "views");
});
