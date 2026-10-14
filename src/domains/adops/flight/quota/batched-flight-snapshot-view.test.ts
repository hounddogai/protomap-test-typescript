import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFlightSnapshotView, toBatchedFlightSnapshotViews } from "./batched-flight-snapshot-view.js";
import { newBatchedFlightSnapshot } from "./batched-flight-snapshot.js";

test("BatchedFlightSnapshotView shows the status in capitals", () => {
  const item = newBatchedFlightSnapshot("code-424", "name-530");
  const view = toBatchedFlightSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFlightSnapshotViews([item, item]).length, 2, "views");
});
