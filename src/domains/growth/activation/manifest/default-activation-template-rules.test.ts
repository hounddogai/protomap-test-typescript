import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultActivationTemplateBatchSizeRangeRule,
  DefaultActivationTemplateRequiredCodeRule,
  DefaultActivationTemplateStartsAtRangeRule,
  DefaultActivationTemplateTitleLengthRule,
  DefaultActivationTemplateUtmSourceLengthRule,
  defaultDefaultActivationTemplateValidator,
} from "./default-activation-template-rules.js";
import { newDefaultActivationTemplate } from "./default-activation-template.js";

test("DefaultActivationTemplateValidator reports every problem", () => {
  const validator = defaultDefaultActivationTemplateValidator();
  const item = newDefaultActivationTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultActivationTemplateStartsAtRangeRule flags values above starts at", () => {
  const rule = new DefaultActivationTemplateStartsAtRangeRule(255, 1000);
  const item = newDefaultActivationTemplate("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultActivationTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultActivationTemplateRequiredCodeRule("default activation template needs a value");
  const item = newDefaultActivationTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultActivationTemplateUtmSourceLengthRule flags a long utm source", () => {
  const rule = new DefaultActivationTemplateUtmSourceLengthRule(86400);
  const item = newDefaultActivationTemplate("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultActivationTemplateTitleLengthRule flags a long title", () => {
  const rule = new DefaultActivationTemplateTitleLengthRule(32);
  const item = newDefaultActivationTemplate("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultActivationTemplateBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DefaultActivationTemplateBatchSizeRangeRule(3600, 86400);
  const item = newDefaultActivationTemplate("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
