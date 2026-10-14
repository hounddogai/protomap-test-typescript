import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyRequestView, toReplyRequestViews } from "./reply-request-view.js";
import { newReplyRequest } from "./reply-request.js";

test("ReplyRequestView shows the status in capitals", () => {
  const item = newReplyRequest("code-87", "title-76");
  const view = toReplyRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyRequestViews([item, item]).length, 2, "views");
});
