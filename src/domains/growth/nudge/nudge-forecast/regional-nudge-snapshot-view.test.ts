import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalNudgeSnapshotView, toRegionalNudgeSnapshotViews } from "./regional-nudge-snapshot-view.js";
import { newRegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

test("RegionalNudgeSnapshotView shows the status in capitals", () => {
  const item = newRegionalNudgeSnapshot("code-132", "label-391");
  const view = toRegionalNudgeSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalNudgeSnapshotViews([item, item]).length, 2, "views");
});
