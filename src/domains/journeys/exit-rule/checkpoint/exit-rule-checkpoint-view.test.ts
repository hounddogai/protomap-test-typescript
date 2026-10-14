import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleCheckpointView, toExitRuleCheckpointViews } from "./exit-rule-checkpoint-view.js";
import { newExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

test("ExitRuleCheckpointView shows the status in capitals", () => {
  const item = newExitRuleCheckpoint("code-637", "title-386");
  const view = toExitRuleCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleCheckpointViews([item, item]).length, 2, "views");
});
