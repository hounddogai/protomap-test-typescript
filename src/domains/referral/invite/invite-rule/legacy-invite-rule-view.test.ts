import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyInviteRuleView, toLegacyInviteRuleViews } from "./legacy-invite-rule-view.js";
import { newLegacyInviteRule } from "./legacy-invite-rule.js";

test("LegacyInviteRuleView shows the status in capitals", () => {
  const item = newLegacyInviteRule("code-674", "name-858");
  const view = toLegacyInviteRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyInviteRuleViews([item, item]).length, 2, "views");
});
