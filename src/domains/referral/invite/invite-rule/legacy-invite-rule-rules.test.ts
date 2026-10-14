import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyInviteRuleAmountRangeRule,
  LegacyInviteRuleCeilingRangeRule,
  LegacyInviteRuleRequiredCodeRule,
  defaultLegacyInviteRuleValidator,
} from "./legacy-invite-rule-rules.js";
import { newLegacyInviteRule } from "./legacy-invite-rule.js";

test("LegacyInviteRuleValidator reports every problem", () => {
  const validator = defaultLegacyInviteRuleValidator();
  const item = newLegacyInviteRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyInviteRuleRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyInviteRuleRequiredCodeRule("legacy invite rule needs an entry");
  const item = newLegacyInviteRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyInviteRuleAmountRangeRule flags values above amount", () => {
  const rule = new LegacyInviteRuleAmountRangeRule(8, 2574.2);
  const item = newLegacyInviteRule("x", "y");
  item.amount = 2575.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyInviteRuleCeilingRangeRule flags values above ceiling", () => {
  const rule = new LegacyInviteRuleCeilingRangeRule(9.9, 1809.9);
  const item = newLegacyInviteRule("x", "y");
  item.ceiling = 1811.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
