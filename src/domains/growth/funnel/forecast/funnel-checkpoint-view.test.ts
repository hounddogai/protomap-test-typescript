import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelCheckpointView, toFunnelCheckpointViews } from "./funnel-checkpoint-view.js";
import { newFunnelCheckpoint } from "./funnel-checkpoint.js";

test("FunnelCheckpointView shows the status in capitals", () => {
  const item = newFunnelCheckpoint("code-367", "label-64");
  const view = toFunnelCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelCheckpointViews([item, item]).length, 2, "views");
});
