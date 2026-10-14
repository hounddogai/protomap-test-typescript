import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteRuleView, toInviteRuleViews } from "./invite-rule-view.js";
import { newInviteRule } from "./invite-rule.js";

test("InviteRuleView shows the status in capitals", () => {
  const item = newInviteRule("code-674", "name-621");
  const view = toInviteRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteRuleViews([item, item]).length, 2, "views");
});
