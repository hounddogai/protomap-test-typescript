import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionThresholdView, toMentionThresholdViews } from "./mention-threshold-view.js";
import { newMentionThreshold } from "./mention-threshold.js";

test("MentionThresholdView shows the status in capitals", () => {
  const item = newMentionThreshold("code-661", "title-791");
  const view = toMentionThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionThresholdViews([item, item]).length, 2, "views");
});
