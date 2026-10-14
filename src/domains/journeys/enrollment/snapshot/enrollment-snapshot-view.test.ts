import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentSnapshotView, toEnrollmentSnapshotViews } from "./enrollment-snapshot-view.js";
import { newEnrollmentSnapshot } from "./enrollment-snapshot.js";

test("EnrollmentSnapshotView shows the status in capitals", () => {
  const item = newEnrollmentSnapshot("code-105", "title-896");
  const view = toEnrollmentSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentSnapshotViews([item, item]).length, 2, "views");
});
