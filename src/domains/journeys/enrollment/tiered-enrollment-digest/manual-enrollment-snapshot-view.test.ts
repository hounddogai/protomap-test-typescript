import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualEnrollmentSnapshotView,
  toManualEnrollmentSnapshotViews,
} from "./manual-enrollment-snapshot-view.js";
import { newManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

test("ManualEnrollmentSnapshotView shows the status in capitals", () => {
  const item = newManualEnrollmentSnapshot("code-694", "label-284");
  const view = toManualEnrollmentSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualEnrollmentSnapshotViews([item, item]).length, 2, "views");
});
