import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyBaselineView, toReplyBaselineViews } from "./reply-baseline-view.js";
import { newReplyBaseline } from "./reply-baseline.js";

test("ReplyBaselineView shows the status in capitals", () => {
  const item = newReplyBaseline("code-214", "label-574");
  const view = toReplyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyBaselineViews([item, item]).length, 2, "views");
});
