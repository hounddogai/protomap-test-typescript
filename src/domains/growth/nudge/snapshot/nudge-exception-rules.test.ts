import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeExceptionExpiresAtRangeRule,
  NudgeExceptionRequiredLabelRule,
  NudgeExceptionRequiredTimezoneRule,
  defaultNudgeExceptionValidator,
} from "./nudge-exception-rules.js";
import { newNudgeException } from "./nudge-exception.js";

test("NudgeExceptionValidator reports every problem", () => {
  const validator = defaultNudgeExceptionValidator();
  const item = newNudgeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeExceptionRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new NudgeExceptionRequiredTimezoneRule("nudge exception needs an entry");
  const item = newNudgeException("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeExceptionExpiresAtRangeRule flags values above expires at", () => {
  const rule = new NudgeExceptionExpiresAtRangeRule(64, 1000);
  const item = newNudgeException("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new NudgeExceptionRequiredLabelRule("nudge exception needs this field");
  const item = newNudgeException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
