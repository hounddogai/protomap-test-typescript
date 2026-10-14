import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWaitCheckpointView, toLegacyWaitCheckpointViews } from "./legacy-wait-checkpoint-view.js";
import { newLegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

test("LegacyWaitCheckpointView shows the status in capitals", () => {
  const item = newLegacyWaitCheckpoint("code-897", "title-833");
  const view = toLegacyWaitCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWaitCheckpointViews([item, item]).length, 2, "views");
});
