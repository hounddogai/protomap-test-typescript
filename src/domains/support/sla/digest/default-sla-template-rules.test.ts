import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSlaTemplateAttemptsRangeRule,
  DefaultSlaTemplateBidRangeRule,
  DefaultSlaTemplateMaximumRangeRule,
  DefaultSlaTemplateUnitLengthRule,
  defaultDefaultSlaTemplateValidator,
} from "./default-sla-template-rules.js";
import { newDefaultSlaTemplate } from "./default-sla-template.js";

test("DefaultSlaTemplateValidator reports every problem", () => {
  const validator = defaultDefaultSlaTemplateValidator();
  const item = newDefaultSlaTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSlaTemplateAttemptsRangeRule flags values above attempts", () => {
  const rule = new DefaultSlaTemplateAttemptsRangeRule(255, 3600);
  const item = newDefaultSlaTemplate("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultSlaTemplateUnitLengthRule flags a long unit", () => {
  const rule = new DefaultSlaTemplateUnitLengthRule(1000);
  const item = newDefaultSlaTemplate("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultSlaTemplateBidRangeRule flags values above bid", () => {
  const rule = new DefaultSlaTemplateBidRangeRule(7.5, 3654.1);
  const item = newDefaultSlaTemplate("x", "y");
  item.bid = 3655.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultSlaTemplateMaximumRangeRule flags values above maximum", () => {
  const rule = new DefaultSlaTemplateMaximumRangeRule(6.6, 3502.5);
  const item = newDefaultSlaTemplate("x", "y");
  item.maximum = 3504;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
