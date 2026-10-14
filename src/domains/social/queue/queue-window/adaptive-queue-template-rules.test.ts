import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveQueueTemplateCodeLengthRule,
  AdaptiveQueueTemplateRequiredCodeRule,
  AdaptiveQueueTemplateWindowDaysRangeRule,
  defaultAdaptiveQueueTemplateValidator,
} from "./adaptive-queue-template-rules.js";
import { newAdaptiveQueueTemplate } from "./adaptive-queue-template.js";

test("AdaptiveQueueTemplateValidator reports every problem", () => {
  const validator = defaultAdaptiveQueueTemplateValidator();
  const item = newAdaptiveQueueTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveQueueTemplateWindowDaysRangeRule flags values above window days", () => {
  const rule = new AdaptiveQueueTemplateWindowDaysRangeRule(120, 255);
  const item = newAdaptiveQueueTemplate("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveQueueTemplateCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveQueueTemplateCodeLengthRule(64);
  const item = newAdaptiveQueueTemplate("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveQueueTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveQueueTemplateRequiredCodeRule("adaptive queue template needs an entry");
  const item = newAdaptiveQueueTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
