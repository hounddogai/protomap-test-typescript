import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencySnapshotView, toFrequencySnapshotViews } from "./frequency-snapshot-view.js";
import { newFrequencySnapshot } from "./frequency-snapshot.js";

test("FrequencySnapshotView shows the status in capitals", () => {
  const item = newFrequencySnapshot("code-385", "title-477");
  const view = toFrequencySnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencySnapshotViews([item, item]).length, 2, "views");
});
