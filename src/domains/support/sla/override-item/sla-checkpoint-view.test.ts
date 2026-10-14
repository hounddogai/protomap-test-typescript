import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaCheckpointView, toSlaCheckpointViews } from "./sla-checkpoint-view.js";
import { newSlaCheckpoint } from "./sla-checkpoint.js";

test("SlaCheckpointView shows the status in capitals", () => {
  const item = newSlaCheckpoint("code-615", "label-477");
  const view = toSlaCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaCheckpointViews([item, item]).length, 2, "views");
});
