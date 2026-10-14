import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceSnapshotView, toPreferenceSnapshotViews } from "./preference-snapshot-view.js";
import { newPreferenceSnapshot } from "./preference-snapshot.js";

test("PreferenceSnapshotView shows the status in capitals", () => {
  const item = newPreferenceSnapshot("code-640", "label-261");
  const view = toPreferenceSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceSnapshotViews([item, item]).length, 2, "views");
});
