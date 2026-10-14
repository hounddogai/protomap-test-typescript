import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyRollupView, toReplyRollupViews } from "./reply-rollup-view.js";
import { newReplyRollup } from "./reply-rollup.js";

test("ReplyRollupView shows the status in capitals", () => {
  const item = newReplyRollup("code-975", "title-20");
  const view = toReplyRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyRollupViews([item, item]).length, 2, "views");
});
