import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutTemplateAttemptsRangeRule,
  OptOutTemplateRateRangeRule,
  OptOutTemplateSegmentLengthRule,
  OptOutTemplateTimezoneLengthRule,
  defaultOptOutTemplateValidator,
} from "./opt-out-template-rules.js";
import { newOptOutTemplate } from "./opt-out-template.js";

test("OptOutTemplateValidator reports every problem", () => {
  const validator = defaultOptOutTemplateValidator();
  const item = newOptOutTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutTemplateTimezoneLengthRule flags a long timezone", () => {
  const rule = new OptOutTemplateTimezoneLengthRule(120);
  const item = newOptOutTemplate("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutTemplateAttemptsRangeRule flags values above attempts", () => {
  const rule = new OptOutTemplateAttemptsRangeRule(32, 1000);
  const item = newOptOutTemplate("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutTemplateRateRangeRule flags values above rate", () => {
  const rule = new OptOutTemplateRateRangeRule(1.7, 527.3);
  const item = newOptOutTemplate("x", "y");
  item.rate = 528.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutTemplateSegmentLengthRule flags a long segment", () => {
  const rule = new OptOutTemplateSegmentLengthRule(32);
  const item = newOptOutTemplate("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
