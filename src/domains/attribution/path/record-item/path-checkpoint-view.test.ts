import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathCheckpointView, toPathCheckpointViews } from "./path-checkpoint-view.js";
import { newPathCheckpoint } from "./path-checkpoint.js";

test("PathCheckpointView shows the status in capitals", () => {
  const item = newPathCheckpoint("code-907", "name-31");
  const view = toPathCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathCheckpointViews([item, item]).length, 2, "views");
});
