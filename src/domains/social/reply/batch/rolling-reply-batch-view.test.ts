import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingReplyBatchView, toRollingReplyBatchViews } from "./rolling-reply-batch-view.js";
import { newRollingReplyBatch } from "./rolling-reply-batch.js";

test("RollingReplyBatchView shows the status in capitals", () => {
  const item = newRollingReplyBatch("code-510", "label-129");
  const view = toRollingReplyBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingReplyBatchViews([item, item]).length, 2, "views");
});
