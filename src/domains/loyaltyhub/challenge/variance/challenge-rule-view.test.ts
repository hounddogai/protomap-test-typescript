import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeRuleView, toChallengeRuleViews } from "./challenge-rule-view.js";
import { newChallengeRule } from "./challenge-rule.js";

test("ChallengeRuleView shows the status in capitals", () => {
  const item = newChallengeRule("code-939", "label-337");
  const view = toChallengeRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeRuleViews([item, item]).length, 2, "views");
});
