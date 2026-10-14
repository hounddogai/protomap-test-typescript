import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyMappingView, toReplyMappingViews } from "./reply-mapping-view.js";
import { newReplyMapping } from "./reply-mapping.js";

test("ReplyMappingView shows the status in capitals", () => {
  const item = newReplyMapping("code-760", "label-693");
  const view = toReplyMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyMappingViews([item, item]).length, 2, "views");
});
