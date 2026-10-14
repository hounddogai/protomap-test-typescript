import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFlightCheckpointView, toStrictFlightCheckpointViews } from "./strict-flight-checkpoint-view.js";
import { newStrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

test("StrictFlightCheckpointView shows the status in capitals", () => {
  const item = newStrictFlightCheckpoint("code-710", "name-715");
  const view = toStrictFlightCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFlightCheckpointViews([item, item]).length, 2, "views");
});
