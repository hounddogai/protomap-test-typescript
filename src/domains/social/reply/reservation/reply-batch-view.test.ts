import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyBatchView, toReplyBatchViews } from "./reply-batch-view.js";
import { newReplyBatch } from "./reply-batch.js";

test("ReplyBatchView shows the status in capitals", () => {
  const item = newReplyBatch("code-32", "label-970");
  const view = toReplyBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyBatchViews([item, item]).length, 2, "views");
});
