import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRewardRuleAgreementCodeLengthRule,
  ManualRewardRuleAgreementRequiredTitleRule,
  ManualRewardRuleAgreementTitleLengthRule,
  defaultManualRewardRuleAgreementValidator,
} from "./manual-reward-rule-agreement-rules.js";
import { newManualRewardRuleAgreement } from "./manual-reward-rule-agreement.js";

test("ManualRewardRuleAgreementValidator reports every problem", () => {
  const validator = defaultManualRewardRuleAgreementValidator();
  const item = newManualRewardRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRewardRuleAgreementTitleLengthRule flags a long title", () => {
  const rule = new ManualRewardRuleAgreementTitleLengthRule(3600);
  const item = newManualRewardRuleAgreement("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleAgreementCodeLengthRule flags a long code", () => {
  const rule = new ManualRewardRuleAgreementCodeLengthRule(64);
  const item = newManualRewardRuleAgreement("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new ManualRewardRuleAgreementRequiredTitleRule("manual reward rule agreement needs this field");
  const item = newManualRewardRuleAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
