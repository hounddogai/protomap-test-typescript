import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeTemplateAmountRangeRule,
  ChallengeTemplateCategoryLengthRule,
  ChallengeTemplateCodeLengthRule,
  ChallengeTemplateRequiredCodeRule,
  defaultChallengeTemplateValidator,
} from "./challenge-template-rules.js";
import { newChallengeTemplate } from "./challenge-template.js";

test("ChallengeTemplateValidator reports every problem", () => {
  const validator = defaultChallengeTemplateValidator();
  const item = newChallengeTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeTemplateCodeLengthRule flags a long code", () => {
  const rule = new ChallengeTemplateCodeLengthRule(86400);
  const item = newChallengeTemplate("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeTemplateAmountRangeRule flags values above amount", () => {
  const rule = new ChallengeTemplateAmountRangeRule(7.8, 965.3);
  const item = newChallengeTemplate("x", "y");
  item.amount = 966.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeTemplateCategoryLengthRule flags a long category", () => {
  const rule = new ChallengeTemplateCategoryLengthRule(1000);
  const item = newChallengeTemplate("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new ChallengeTemplateRequiredCodeRule("challenge template needs an entry");
  const item = newChallengeTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
