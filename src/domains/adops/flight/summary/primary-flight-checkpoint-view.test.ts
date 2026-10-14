import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFlightCheckpointView, toPrimaryFlightCheckpointViews } from "./primary-flight-checkpoint-view.js";
import { newPrimaryFlightCheckpoint } from "./primary-flight-checkpoint.js";

test("PrimaryFlightCheckpointView shows the status in capitals", () => {
  const item = newPrimaryFlightCheckpoint("code-546", "name-673");
  const view = toPrimaryFlightCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFlightCheckpointViews([item, item]).length, 2, "views");
});
