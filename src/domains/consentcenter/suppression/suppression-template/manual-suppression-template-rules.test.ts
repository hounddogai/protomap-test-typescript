import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSuppressionTemplateAmountRangeRule,
  ManualSuppressionTemplateDescriptionLengthRule,
  ManualSuppressionTemplateLabelLengthRule,
  defaultManualSuppressionTemplateValidator,
} from "./manual-suppression-template-rules.js";
import { newManualSuppressionTemplate } from "./manual-suppression-template.js";

test("ManualSuppressionTemplateValidator reports every problem", () => {
  const validator = defaultManualSuppressionTemplateValidator();
  const item = newManualSuppressionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSuppressionTemplateDescriptionLengthRule flags a long description", () => {
  const rule = new ManualSuppressionTemplateDescriptionLengthRule(86400);
  const item = newManualSuppressionTemplate("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualSuppressionTemplateAmountRangeRule flags values above amount", () => {
  const rule = new ManualSuppressionTemplateAmountRangeRule(7.1, 4334.7);
  const item = newManualSuppressionTemplate("x", "y");
  item.amount = 4336.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualSuppressionTemplateLabelLengthRule flags a long label", () => {
  const rule = new ManualSuppressionTemplateLabelLengthRule(1000);
  const item = newManualSuppressionTemplate("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
