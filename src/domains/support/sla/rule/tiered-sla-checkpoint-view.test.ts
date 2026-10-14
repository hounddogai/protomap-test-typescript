import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredSlaCheckpointView, toTieredSlaCheckpointViews } from "./tiered-sla-checkpoint-view.js";
import { newTieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

test("TieredSlaCheckpointView shows the status in capitals", () => {
  const item = newTieredSlaCheckpoint("code-211", "title-411");
  const view = toTieredSlaCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSlaCheckpointViews([item, item]).length, 2, "views");
});
