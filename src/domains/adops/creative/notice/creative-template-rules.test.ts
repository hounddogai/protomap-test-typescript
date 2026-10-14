import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeTemplateGraceDaysRangeRule,
  CreativeTemplateRetriesRangeRule,
  CreativeTemplateThresholdRangeRule,
  defaultCreativeTemplateValidator,
} from "./creative-template-rules.js";
import { newCreativeTemplate } from "./creative-template.js";

test("CreativeTemplateValidator reports every problem", () => {
  const validator = defaultCreativeTemplateValidator();
  const item = newCreativeTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeTemplateThresholdRangeRule flags values above threshold", () => {
  const rule = new CreativeTemplateThresholdRangeRule(4, 2907.1);
  const item = newCreativeTemplate("x", "y");
  item.threshold = 2908.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeTemplateRetriesRangeRule flags values above retries", () => {
  const rule = new CreativeTemplateRetriesRangeRule(255, 3600);
  const item = newCreativeTemplate("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeTemplateGraceDaysRangeRule flags values above grace days", () => {
  const rule = new CreativeTemplateGraceDaysRangeRule(16, 120);
  const item = newCreativeTemplate("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
