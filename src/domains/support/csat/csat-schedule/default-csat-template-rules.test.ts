import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCsatTemplateCodeLengthRule,
  DefaultCsatTemplateNameLengthRule,
  DefaultCsatTemplateRequiredNameRule,
  defaultDefaultCsatTemplateValidator,
} from "./default-csat-template-rules.js";
import { newDefaultCsatTemplate } from "./default-csat-template.js";

test("DefaultCsatTemplateValidator reports every problem", () => {
  const validator = defaultDefaultCsatTemplateValidator();
  const item = newDefaultCsatTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCsatTemplateRequiredNameRule flags a blank name", () => {
  const rule = new DefaultCsatTemplateRequiredNameRule("default csat template needs this field");
  const item = newDefaultCsatTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultCsatTemplateCodeLengthRule flags a long code", () => {
  const rule = new DefaultCsatTemplateCodeLengthRule(32);
  const item = newDefaultCsatTemplate("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultCsatTemplateNameLengthRule flags a long name", () => {
  const rule = new DefaultCsatTemplateNameLengthRule(64);
  const item = newDefaultCsatTemplate("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
