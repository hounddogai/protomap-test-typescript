import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyRuleView, toReplyRuleViews } from "./reply-rule-view.js";
import { newReplyRule } from "./reply-rule.js";

test("ReplyRuleView shows the status in capitals", () => {
  const item = newReplyRule("code-526", "title-700");
  const view = toReplyRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyRuleViews([item, item]).length, 2, "views");
});
