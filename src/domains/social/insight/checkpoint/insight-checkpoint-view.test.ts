import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightCheckpointView, toInsightCheckpointViews } from "./insight-checkpoint-view.js";
import { newInsightCheckpoint } from "./insight-checkpoint.js";

test("InsightCheckpointView shows the status in capitals", () => {
  const item = newInsightCheckpoint("code-825", "name-366");
  const view = toInsightCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightCheckpointViews([item, item]).length, 2, "views");
});
