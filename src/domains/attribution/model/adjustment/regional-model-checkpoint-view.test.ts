import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalModelCheckpointView, toRegionalModelCheckpointViews } from "./regional-model-checkpoint-view.js";
import { newRegionalModelCheckpoint } from "./regional-model-checkpoint.js";

test("RegionalModelCheckpointView shows the status in capitals", () => {
  const item = newRegionalModelCheckpoint("code-950", "title-416");
  const view = toRegionalModelCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalModelCheckpointViews([item, item]).length, 2, "views");
});
