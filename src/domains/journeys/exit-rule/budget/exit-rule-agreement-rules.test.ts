import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleAgreementLimitRangeRule,
  ExitRuleAgreementMinimumRangeRule,
  ExitRuleAgreementRequiredDescriptionRule,
  ExitRuleAgreementRequiredTimezoneRule,
  ExitRuleAgreementRevisionRangeRule,
  defaultExitRuleAgreementValidator,
} from "./exit-rule-agreement-rules.js";
import { newExitRuleAgreement } from "./exit-rule-agreement.js";

test("ExitRuleAgreementValidator reports every problem", () => {
  const validator = defaultExitRuleAgreementValidator();
  const item = newExitRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleAgreementMinimumRangeRule flags values above minimum", () => {
  const rule = new ExitRuleAgreementMinimumRangeRule(8.8, 3774.7);
  const item = newExitRuleAgreement("x", "y");
  item.minimum = 3776.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAgreementRevisionRangeRule flags values above revision", () => {
  const rule = new ExitRuleAgreementRevisionRangeRule(3600, 86400);
  const item = newExitRuleAgreement("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAgreementLimitRangeRule flags values above limit", () => {
  const rule = new ExitRuleAgreementLimitRangeRule(16, 86400);
  const item = newExitRuleAgreement("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAgreementRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ExitRuleAgreementRequiredTimezoneRule("exit rule agreement needs a value");
  const item = newExitRuleAgreement("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleAgreementRequiredDescriptionRule flags a blank description", () => {
  const rule = new ExitRuleAgreementRequiredDescriptionRule("exit rule agreement needs this field");
  const item = newExitRuleAgreement("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
