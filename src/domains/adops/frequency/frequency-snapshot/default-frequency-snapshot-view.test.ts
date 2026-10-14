import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultFrequencySnapshotView,
  toDefaultFrequencySnapshotViews,
} from "./default-frequency-snapshot-view.js";
import { newDefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

test("DefaultFrequencySnapshotView shows the status in capitals", () => {
  const item = newDefaultFrequencySnapshot("code-960", "name-763");
  const view = toDefaultFrequencySnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFrequencySnapshotViews([item, item]).length, 2, "views");
});
