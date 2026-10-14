import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingFraudCheckSnapshotView,
  toPendingFraudCheckSnapshotViews,
} from "./pending-fraud-check-snapshot-view.js";
import { newPendingFraudCheckSnapshot } from "./pending-fraud-check-snapshot.js";

test("PendingFraudCheckSnapshotView shows the status in capitals", () => {
  const item = newPendingFraudCheckSnapshot("code-833", "label-355");
  const view = toPendingFraudCheckSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingFraudCheckSnapshotViews([item, item]).length, 2, "views");
});
