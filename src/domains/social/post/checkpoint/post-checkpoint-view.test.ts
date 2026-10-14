import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostCheckpointView, toPostCheckpointViews } from "./post-checkpoint-view.js";
import { newPostCheckpoint } from "./post-checkpoint.js";

test("PostCheckpointView shows the status in capitals", () => {
  const item = newPostCheckpoint("code-265", "label-371");
  const view = toPostCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostCheckpointViews([item, item]).length, 2, "views");
});
