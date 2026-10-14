import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionCheckpointView, toSuppressionCheckpointViews } from "./suppression-checkpoint-view.js";
import { newSuppressionCheckpoint } from "./suppression-checkpoint.js";

test("SuppressionCheckpointView shows the status in capitals", () => {
  const item = newSuppressionCheckpoint("code-702", "label-607");
  const view = toSuppressionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionCheckpointViews([item, item]).length, 2, "views");
});
