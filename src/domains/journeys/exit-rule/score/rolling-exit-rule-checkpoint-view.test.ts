import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingExitRuleCheckpointView,
  toRollingExitRuleCheckpointViews,
} from "./rolling-exit-rule-checkpoint-view.js";
import { newRollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

test("RollingExitRuleCheckpointView shows the status in capitals", () => {
  const item = newRollingExitRuleCheckpoint("code-476", "name-651");
  const view = toRollingExitRuleCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingExitRuleCheckpointViews([item, item]).length, 2, "views");
});
