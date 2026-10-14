import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingFlightCheckpointView, toPendingFlightCheckpointViews } from "./pending-flight-checkpoint-view.js";
import { newPendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

test("PendingFlightCheckpointView shows the status in capitals", () => {
  const item = newPendingFlightCheckpoint("code-209", "title-464");
  const view = toPendingFlightCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingFlightCheckpointViews([item, item]).length, 2, "views");
});
