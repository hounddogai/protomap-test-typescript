import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalModelCheckpointView, toGlobalModelCheckpointViews } from "./global-model-checkpoint-view.js";
import { newGlobalModelCheckpoint } from "./global-model-checkpoint.js";

test("GlobalModelCheckpointView shows the status in capitals", () => {
  const item = newGlobalModelCheckpoint("code-898", "name-146");
  const view = toGlobalModelCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalModelCheckpointViews([item, item]).length, 2, "views");
});
