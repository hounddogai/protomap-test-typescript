import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationCheckpointView, toActivationCheckpointViews } from "./activation-checkpoint-view.js";
import { newActivationCheckpoint } from "./activation-checkpoint.js";

test("ActivationCheckpointView shows the status in capitals", () => {
  const item = newActivationCheckpoint("code-392", "label-888");
  const view = toActivationCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationCheckpointViews([item, item]).length, 2, "views");
});
