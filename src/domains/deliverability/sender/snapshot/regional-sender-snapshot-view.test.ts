import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalSenderSnapshotView, toRegionalSenderSnapshotViews } from "./regional-sender-snapshot-view.js";
import { newRegionalSenderSnapshot } from "./regional-sender-snapshot.js";

test("RegionalSenderSnapshotView shows the status in capitals", () => {
  const item = newRegionalSenderSnapshot("code-101", "label-943");
  const view = toRegionalSenderSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSenderSnapshotViews([item, item]).length, 2, "views");
});
