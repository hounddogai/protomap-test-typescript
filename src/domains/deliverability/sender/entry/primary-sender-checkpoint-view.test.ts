import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySenderCheckpointView, toPrimarySenderCheckpointViews } from "./primary-sender-checkpoint-view.js";
import { newPrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

test("PrimarySenderCheckpointView shows the status in capitals", () => {
  const item = newPrimarySenderCheckpoint("code-662", "name-365");
  const view = toPrimarySenderCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySenderCheckpointViews([item, item]).length, 2, "views");
});
