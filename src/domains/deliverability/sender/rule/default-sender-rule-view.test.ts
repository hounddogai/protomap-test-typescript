import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultSenderRuleView, toDefaultSenderRuleViews } from "./default-sender-rule-view.js";
import { newDefaultSenderRule } from "./default-sender-rule.js";

test("DefaultSenderRuleView shows the status in capitals", () => {
  const item = newDefaultSenderRule("code-759", "name-487");
  const view = toDefaultSenderRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultSenderRuleViews([item, item]).length, 2, "views");
});
