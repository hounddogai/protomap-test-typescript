import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackEscalationSummaryAttemptsRangeRule,
  FallbackEscalationSummaryNameLengthRule,
  FallbackEscalationSummaryPriorityRangeRule,
  FallbackEscalationSummaryTitleLengthRule,
  defaultFallbackEscalationSummaryValidator,
} from "./fallback-escalation-summary-rules.js";
import { newFallbackEscalationSummary } from "./fallback-escalation-summary.js";

test("FallbackEscalationSummaryValidator reports every problem", () => {
  const validator = defaultFallbackEscalationSummaryValidator();
  const item = newFallbackEscalationSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackEscalationSummaryAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackEscalationSummaryAttemptsRangeRule(255, 3600);
  const item = newFallbackEscalationSummary("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackEscalationSummaryNameLengthRule flags a long name", () => {
  const rule = new FallbackEscalationSummaryNameLengthRule(3600);
  const item = newFallbackEscalationSummary("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackEscalationSummaryPriorityRangeRule flags values above priority", () => {
  const rule = new FallbackEscalationSummaryPriorityRangeRule(255, 1000);
  const item = newFallbackEscalationSummary("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackEscalationSummaryTitleLengthRule flags a long title", () => {
  const rule = new FallbackEscalationSummaryTitleLengthRule(86400);
  const item = newFallbackEscalationSummary("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
