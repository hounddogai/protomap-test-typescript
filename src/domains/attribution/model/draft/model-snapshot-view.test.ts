import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelSnapshotView, toModelSnapshotViews } from "./model-snapshot-view.js";
import { newModelSnapshot } from "./model-snapshot.js";

test("ModelSnapshotView shows the status in capitals", () => {
  const item = newModelSnapshot("code-628", "label-60");
  const view = toModelSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelSnapshotViews([item, item]).length, 2, "views");
});
