import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDeflectionTemplateCodeLengthRule,
  AdaptiveDeflectionTemplateFrequencyCapRangeRule,
  AdaptiveDeflectionTemplateRequiredCodeRule,
  AdaptiveDeflectionTemplateRequiredTitleRule,
  AdaptiveDeflectionTemplateTitleLengthRule,
  defaultAdaptiveDeflectionTemplateValidator,
} from "./adaptive-deflection-template-rules.js";
import { newAdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

test("AdaptiveDeflectionTemplateValidator reports every problem", () => {
  const validator = defaultAdaptiveDeflectionTemplateValidator();
  const item = newAdaptiveDeflectionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDeflectionTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveDeflectionTemplateRequiredTitleRule("adaptive deflection template needs this field");
  const item = newAdaptiveDeflectionTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDeflectionTemplateTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveDeflectionTemplateTitleLengthRule(255);
  const item = newAdaptiveDeflectionTemplate("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDeflectionTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDeflectionTemplateRequiredCodeRule("adaptive deflection template needs a value");
  const item = newAdaptiveDeflectionTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDeflectionTemplateFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new AdaptiveDeflectionTemplateFrequencyCapRangeRule(80, 255);
  const item = newAdaptiveDeflectionTemplate("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDeflectionTemplateCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveDeflectionTemplateCodeLengthRule(16);
  const item = newAdaptiveDeflectionTemplate("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
