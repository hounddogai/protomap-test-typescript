import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackFlightSnapshotView, toFallbackFlightSnapshotViews } from "./fallback-flight-snapshot-view.js";
import { newFallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

test("FallbackFlightSnapshotView shows the status in capitals", () => {
  const item = newFallbackFlightSnapshot("code-901", "label-874");
  const view = toFallbackFlightSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFlightSnapshotViews([item, item]).length, 2, "views");
});
