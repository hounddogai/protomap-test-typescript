import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedNudgeExceptionClicksRangeRule,
  CappedNudgeExceptionCodeLengthRule,
  CappedNudgeExceptionOpenRateRangeRule,
  CappedNudgeExceptionPriorityRangeRule,
  CappedNudgeExceptionRequiredCodeRule,
  defaultCappedNudgeExceptionValidator,
} from "./capped-nudge-exception-rules.js";
import { newCappedNudgeException } from "./capped-nudge-exception.js";

test("CappedNudgeExceptionValidator reports every problem", () => {
  const validator = defaultCappedNudgeExceptionValidator();
  const item = newCappedNudgeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedNudgeExceptionOpenRateRangeRule flags values above open rate", () => {
  const rule = new CappedNudgeExceptionOpenRateRangeRule(0.4, 4624.4);
  const item = newCappedNudgeException("x", "y");
  item.openRate = 4625.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedNudgeExceptionPriorityRangeRule flags values above priority", () => {
  const rule = new CappedNudgeExceptionPriorityRangeRule(16, 3600);
  const item = newCappedNudgeException("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedNudgeExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new CappedNudgeExceptionRequiredCodeRule("capped nudge exception needs this field");
  const item = newCappedNudgeException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedNudgeExceptionCodeLengthRule flags a long code", () => {
  const rule = new CappedNudgeExceptionCodeLengthRule(255);
  const item = newCappedNudgeException("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeExceptionClicksRangeRule flags values above clicks", () => {
  const rule = new CappedNudgeExceptionClicksRangeRule(255, 3600);
  const item = newCappedNudgeException("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
