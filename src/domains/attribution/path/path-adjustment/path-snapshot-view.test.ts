import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathSnapshotView, toPathSnapshotViews } from "./path-snapshot-view.js";
import { newPathSnapshot } from "./path-snapshot.js";

test("PathSnapshotView shows the status in capitals", () => {
  const item = newPathSnapshot("code-544", "label-620");
  const view = toPathSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathSnapshotViews([item, item]).length, 2, "views");
});
