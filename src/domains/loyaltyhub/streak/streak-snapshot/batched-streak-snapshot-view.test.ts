import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedStreakSnapshotView, toBatchedStreakSnapshotViews } from "./batched-streak-snapshot-view.js";
import { newBatchedStreakSnapshot } from "./batched-streak-snapshot.js";

test("BatchedStreakSnapshotView shows the status in capitals", () => {
  const item = newBatchedStreakSnapshot("code-709", "title-390");
  const view = toBatchedStreakSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedStreakSnapshotViews([item, item]).length, 2, "views");
});
