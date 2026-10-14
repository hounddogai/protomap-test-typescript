import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveFlightSnapshotView, toAdaptiveFlightSnapshotViews } from "./adaptive-flight-snapshot-view.js";
import { newAdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

test("AdaptiveFlightSnapshotView shows the status in capitals", () => {
  const item = newAdaptiveFlightSnapshot("code-305", "label-578");
  const view = toAdaptiveFlightSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveFlightSnapshotViews([item, item]).length, 2, "views");
});
