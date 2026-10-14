import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInSnapshotView, toDoubleOptInSnapshotViews } from "./double-opt-in-snapshot-view.js";
import { newDoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

test("DoubleOptInSnapshotView shows the status in capitals", () => {
  const item = newDoubleOptInSnapshot("code-299", "title-576");
  const view = toDoubleOptInSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInSnapshotViews([item, item]).length, 2, "views");
});
