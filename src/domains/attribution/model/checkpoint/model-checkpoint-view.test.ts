import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelCheckpointView, toModelCheckpointViews } from "./model-checkpoint-view.js";
import { newModelCheckpoint } from "./model-checkpoint.js";

test("ModelCheckpointView shows the status in capitals", () => {
  const item = newModelCheckpoint("code-236", "label-905");
  const view = toModelCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelCheckpointViews([item, item]).length, 2, "views");
});
