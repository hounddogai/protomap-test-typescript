import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardSnapshotView, toRewardSnapshotViews } from "./reward-snapshot-view.js";
import { newRewardSnapshot } from "./reward-snapshot.js";

test("RewardSnapshotView shows the status in capitals", () => {
  const item = newRewardSnapshot("code-958", "label-586");
  const view = toRewardSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardSnapshotViews([item, item]).length, 2, "views");
});
