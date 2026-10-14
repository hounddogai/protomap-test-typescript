import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationSnapshotView, toReputationSnapshotViews } from "./reputation-snapshot-view.js";
import { newReputationSnapshot } from "./reputation-snapshot.js";

test("ReputationSnapshotView shows the status in capitals", () => {
  const item = newReputationSnapshot("code-673", "title-83");
  const view = toReputationSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationSnapshotViews([item, item]).length, 2, "views");
});
