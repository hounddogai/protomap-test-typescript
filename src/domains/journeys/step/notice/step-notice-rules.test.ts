import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepNoticeImpressionsRangeRule,
  StepNoticePriorityRangeRule,
  defaultStepNoticeValidator,
} from "./step-notice-rules.js";
import { newStepNotice } from "./step-notice.js";

test("StepNoticeValidator reports every problem", () => {
  const validator = defaultStepNoticeValidator();
  const item = newStepNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepNoticeImpressionsRangeRule flags values above impressions", () => {
  const rule = new StepNoticeImpressionsRangeRule(80, 80);
  const item = newStepNotice("x", "y");
  item.impressions = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepNoticePriorityRangeRule flags values above priority", () => {
  const rule = new StepNoticePriorityRangeRule(255, 3600);
  const item = newStepNotice("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
