import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualFlightCheckpointView, toManualFlightCheckpointViews } from "./manual-flight-checkpoint-view.js";
import { newManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

test("ManualFlightCheckpointView shows the status in capitals", () => {
  const item = newManualFlightCheckpoint("code-857", "title-567");
  const view = toManualFlightCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualFlightCheckpointViews([item, item]).length, 2, "views");
});
