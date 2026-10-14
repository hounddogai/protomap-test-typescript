import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationCheckpointView, toReputationCheckpointViews } from "./reputation-checkpoint-view.js";
import { newReputationCheckpoint } from "./reputation-checkpoint.js";

test("ReputationCheckpointView shows the status in capitals", () => {
  const item = newReputationCheckpoint("code-64", "title-267");
  const view = toReputationCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationCheckpointViews([item, item]).length, 2, "views");
});
