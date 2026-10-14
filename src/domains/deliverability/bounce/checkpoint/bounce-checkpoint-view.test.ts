import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceCheckpointView, toBounceCheckpointViews } from "./bounce-checkpoint-view.js";
import { newBounceCheckpoint } from "./bounce-checkpoint.js";

test("BounceCheckpointView shows the status in capitals", () => {
  const item = newBounceCheckpoint("code-753", "label-35");
  const view = toBounceCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceCheckpointViews([item, item]).length, 2, "views");
});
