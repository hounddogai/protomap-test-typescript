import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedPathSnapshotView, toCappedPathSnapshotViews } from "./capped-path-snapshot-view.js";
import { newCappedPathSnapshot } from "./capped-path-snapshot.js";

test("CappedPathSnapshotView shows the status in capitals", () => {
  const item = newCappedPathSnapshot("code-384", "title-712");
  const view = toCappedPathSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedPathSnapshotViews([item, item]).length, 2, "views");
});
