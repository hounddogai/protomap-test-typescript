import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedInsightSnapshotView, toWeightedInsightSnapshotViews } from "./weighted-insight-snapshot-view.js";
import { newWeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

test("WeightedInsightSnapshotView shows the status in capitals", () => {
  const item = newWeightedInsightSnapshot("code-303", "label-476");
  const view = toWeightedInsightSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedInsightSnapshotViews([item, item]).length, 2, "views");
});
