import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionRuleView, toMentionRuleViews } from "./mention-rule-view.js";
import { newMentionRule } from "./mention-rule.js";

test("MentionRuleView shows the status in capitals", () => {
  const item = newMentionRule("code-985", "title-696");
  const view = toMentionRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionRuleViews([item, item]).length, 2, "views");
});
