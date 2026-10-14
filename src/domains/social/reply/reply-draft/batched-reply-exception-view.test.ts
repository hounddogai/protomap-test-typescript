import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedReplyExceptionView, toBatchedReplyExceptionViews } from "./batched-reply-exception-view.js";
import { newBatchedReplyException } from "./batched-reply-exception.js";

test("BatchedReplyExceptionView shows the status in capitals", () => {
  const item = newBatchedReplyException("code-623", "name-396");
  const view = toBatchedReplyExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedReplyExceptionViews([item, item]).length, 2, "views");
});
