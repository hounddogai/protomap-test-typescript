import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchSnapshotView, toBranchSnapshotViews } from "./branch-snapshot-view.js";
import { newBranchSnapshot } from "./branch-snapshot.js";

test("BranchSnapshotView shows the status in capitals", () => {
  const item = newBranchSnapshot("code-279", "label-367");
  const view = toBranchSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchSnapshotViews([item, item]).length, 2, "views");
});
