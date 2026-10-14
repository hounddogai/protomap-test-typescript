import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalSnapshotView, toApprovalSnapshotViews } from "./approval-snapshot-view.js";
import { newApprovalSnapshot } from "./approval-snapshot.js";

test("ApprovalSnapshotView shows the status in capitals", () => {
  const item = newApprovalSnapshot("code-648", "name-243");
  const view = toApprovalSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalSnapshotViews([item, item]).length, 2, "views");
});
