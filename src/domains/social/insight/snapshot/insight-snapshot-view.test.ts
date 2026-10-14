import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightSnapshotView, toInsightSnapshotViews } from "./insight-snapshot-view.js";
import { newInsightSnapshot } from "./insight-snapshot.js";

test("InsightSnapshotView shows the status in capitals", () => {
  const item = newInsightSnapshot("code-53", "name-185");
  const view = toInsightSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightSnapshotViews([item, item]).length, 2, "views");
});
