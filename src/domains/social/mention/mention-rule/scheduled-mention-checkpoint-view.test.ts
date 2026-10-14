import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledMentionCheckpointView,
  toScheduledMentionCheckpointViews,
} from "./scheduled-mention-checkpoint-view.js";
import { newScheduledMentionCheckpoint } from "./scheduled-mention-checkpoint.js";

test("ScheduledMentionCheckpointView shows the status in capitals", () => {
  const item = newScheduledMentionCheckpoint("code-985", "name-986");
  const view = toScheduledMentionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledMentionCheckpointViews([item, item]).length, 2, "views");
});
