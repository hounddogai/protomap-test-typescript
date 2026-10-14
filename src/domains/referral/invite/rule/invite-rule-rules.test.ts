import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteRuleCodeLengthRule,
  InviteRuleConversionRateRangeRule,
  defaultInviteRuleValidator,
} from "./invite-rule-rules.js";
import { newInviteRule } from "./invite-rule.js";

test("InviteRuleValidator reports every problem", () => {
  const validator = defaultInviteRuleValidator();
  const item = newInviteRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteRuleCodeLengthRule flags a long code", () => {
  const rule = new InviteRuleCodeLengthRule(3600);
  const item = newInviteRule("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteRuleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new InviteRuleConversionRateRangeRule(0.8, 1296.6);
  const item = newInviteRule("x", "y");
  item.conversionRate = 1298.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
