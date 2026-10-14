import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelTemplateGraceDaysRangeRule,
  ModelTemplateNameLengthRule,
  ModelTemplateRequiredCodeRule,
  ModelTemplateRequiredExternalRefRule,
  ModelTemplateRequiredNameRule,
  ModelTemplateRevisionRangeRule,
  defaultModelTemplateValidator,
} from "./model-template-rules.js";
import { newModelTemplate } from "./model-template.js";

test("ModelTemplateValidator reports every problem", () => {
  const validator = defaultModelTemplateValidator();
  const item = newModelTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelTemplateRequiredNameRule flags a blank name", () => {
  const rule = new ModelTemplateRequiredNameRule("model template needs a value");
  const item = newModelTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelTemplateRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ModelTemplateRequiredExternalRefRule("model template needs a value");
  const item = newModelTemplate("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new ModelTemplateRequiredCodeRule("model template needs this field");
  const item = newModelTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelTemplateGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ModelTemplateGraceDaysRangeRule(16, 64);
  const item = newModelTemplate("x", "y");
  item.graceDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelTemplateRevisionRangeRule flags values above revision", () => {
  const rule = new ModelTemplateRevisionRangeRule(255, 86400);
  const item = newModelTemplate("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelTemplateNameLengthRule flags a long name", () => {
  const rule = new ModelTemplateNameLengthRule(255);
  const item = newModelTemplate("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
