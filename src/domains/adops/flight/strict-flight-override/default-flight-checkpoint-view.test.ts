import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFlightCheckpointView, toDefaultFlightCheckpointViews } from "./default-flight-checkpoint-view.js";
import { newDefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

test("DefaultFlightCheckpointView shows the status in capitals", () => {
  const item = newDefaultFlightCheckpoint("code-250", "title-61");
  const view = toDefaultFlightCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFlightCheckpointViews([item, item]).length, 2, "views");
});
