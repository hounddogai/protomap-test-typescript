import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierCheckpointView, toTierCheckpointViews } from "./tier-checkpoint-view.js";
import { newTierCheckpoint } from "./tier-checkpoint.js";

test("TierCheckpointView shows the status in capitals", () => {
  const item = newTierCheckpoint("code-511", "name-389");
  const view = toTierCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierCheckpointViews([item, item]).length, 2, "views");
});
