import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredNudgeSnapshotView, toTieredNudgeSnapshotViews } from "./tiered-nudge-snapshot-view.js";
import { newTieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

test("TieredNudgeSnapshotView shows the status in capitals", () => {
  const item = newTieredNudgeSnapshot("code-179", "title-531");
  const view = toTieredNudgeSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredNudgeSnapshotViews([item, item]).length, 2, "views");
});
