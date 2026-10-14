import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryActivationSnapshotView,
  toPrimaryActivationSnapshotViews,
} from "./primary-activation-snapshot-view.js";
import { newPrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

test("PrimaryActivationSnapshotView shows the status in capitals", () => {
  const item = newPrimaryActivationSnapshot("code-169", "label-618");
  const view = toPrimaryActivationSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryActivationSnapshotViews([item, item]).length, 2, "views");
});
