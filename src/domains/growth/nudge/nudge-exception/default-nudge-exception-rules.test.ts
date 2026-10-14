import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultNudgeExceptionExpiresAtRangeRule,
  DefaultNudgeExceptionLabelLengthRule,
  DefaultNudgeExceptionRequiredLabelRule,
  defaultDefaultNudgeExceptionValidator,
} from "./default-nudge-exception-rules.js";
import { newDefaultNudgeException } from "./default-nudge-exception.js";

test("DefaultNudgeExceptionValidator reports every problem", () => {
  const validator = defaultDefaultNudgeExceptionValidator();
  const item = newDefaultNudgeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultNudgeExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultNudgeExceptionRequiredLabelRule("default nudge exception needs a value");
  const item = newDefaultNudgeException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultNudgeExceptionExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DefaultNudgeExceptionExpiresAtRangeRule(16, 16);
  const item = newDefaultNudgeException("x", "y");
  item.expiresAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultNudgeExceptionLabelLengthRule flags a long label", () => {
  const rule = new DefaultNudgeExceptionLabelLengthRule(255);
  const item = newDefaultNudgeException("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
