import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredPreferenceSnapshotView,
  toTieredPreferenceSnapshotViews,
} from "./tiered-preference-snapshot-view.js";
import { newTieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

test("TieredPreferenceSnapshotView shows the status in capitals", () => {
  const item = newTieredPreferenceSnapshot("code-140", "name-989");
  const view = toTieredPreferenceSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPreferenceSnapshotViews([item, item]).length, 2, "views");
});
