import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryMentionRuleView, toPrimaryMentionRuleViews } from "./primary-mention-rule-view.js";
import { newPrimaryMentionRule } from "./primary-mention-rule.js";

test("PrimaryMentionRuleView shows the status in capitals", () => {
  const item = newPrimaryMentionRule("code-706", "name-568");
  const view = toPrimaryMentionRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryMentionRuleViews([item, item]).length, 2, "views");
});
