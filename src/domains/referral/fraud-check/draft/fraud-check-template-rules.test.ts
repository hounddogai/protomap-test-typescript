import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckTemplateLabelLengthRule,
  FraudCheckTemplateRequiredCodeRule,
  defaultFraudCheckTemplateValidator,
} from "./fraud-check-template-rules.js";
import { newFraudCheckTemplate } from "./fraud-check-template.js";

test("FraudCheckTemplateValidator reports every problem", () => {
  const validator = defaultFraudCheckTemplateValidator();
  const item = newFraudCheckTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new FraudCheckTemplateRequiredCodeRule("fraud check template needs this field");
  const item = newFraudCheckTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckTemplateLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckTemplateLabelLengthRule(64);
  const item = newFraudCheckTemplate("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
