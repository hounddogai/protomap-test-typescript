import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyThresholdView, toReplyThresholdViews } from "./reply-threshold-view.js";
import { newReplyThreshold } from "./reply-threshold.js";

test("ReplyThresholdView shows the status in capitals", () => {
  const item = newReplyThreshold("code-941", "name-816");
  const view = toReplyThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyThresholdViews([item, item]).length, 2, "views");
});
