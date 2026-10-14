import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultMentionRuleView, toDefaultMentionRuleViews } from "./default-mention-rule-view.js";
import { newDefaultMentionRule } from "./default-mention-rule.js";

test("DefaultMentionRuleView shows the status in capitals", () => {
  const item = newDefaultMentionRule("code-746", "label-323");
  const view = toDefaultMentionRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultMentionRuleViews([item, item]).length, 2, "views");
});
