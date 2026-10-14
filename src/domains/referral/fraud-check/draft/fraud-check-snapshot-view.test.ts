import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckSnapshotView, toFraudCheckSnapshotViews } from "./fraud-check-snapshot-view.js";
import { newFraudCheckSnapshot } from "./fraud-check-snapshot.js";

test("FraudCheckSnapshotView shows the status in capitals", () => {
  const item = newFraudCheckSnapshot("code-74", "name-112");
  const view = toFraudCheckSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckSnapshotViews([item, item]).length, 2, "views");
});
