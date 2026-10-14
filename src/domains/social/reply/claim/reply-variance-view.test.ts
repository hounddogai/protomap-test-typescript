import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyVarianceView, toReplyVarianceViews } from "./reply-variance-view.js";
import { newReplyVariance } from "./reply-variance.js";

test("ReplyVarianceView shows the status in capitals", () => {
  const item = newReplyVariance("code-82", "name-406");
  const view = toReplyVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyVarianceViews([item, item]).length, 2, "views");
});
