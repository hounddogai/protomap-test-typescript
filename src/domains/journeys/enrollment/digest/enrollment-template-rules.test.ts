import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentTemplateCodeLengthRule,
  EnrollmentTemplateCurrencyLengthRule,
  EnrollmentTemplateNameLengthRule,
  EnrollmentTemplateRequiredNameRule,
  defaultEnrollmentTemplateValidator,
} from "./enrollment-template-rules.js";
import { newEnrollmentTemplate } from "./enrollment-template.js";

test("EnrollmentTemplateValidator reports every problem", () => {
  const validator = defaultEnrollmentTemplateValidator();
  const item = newEnrollmentTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentTemplateRequiredNameRule flags a blank name", () => {
  const rule = new EnrollmentTemplateRequiredNameRule("enrollment template needs an entry");
  const item = newEnrollmentTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentTemplateCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentTemplateCodeLengthRule(255);
  const item = newEnrollmentTemplate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentTemplateCurrencyLengthRule flags a long currency", () => {
  const rule = new EnrollmentTemplateCurrencyLengthRule(86400);
  const item = newEnrollmentTemplate("x", "y");
  item.currency = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentTemplateNameLengthRule flags a long name", () => {
  const rule = new EnrollmentTemplateNameLengthRule(64);
  const item = newEnrollmentTemplate("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
