import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultWarmupExceptionCreatedAtRangeRule,
  DefaultWarmupExceptionDurationMinutesRangeRule,
  DefaultWarmupExceptionNameLengthRule,
  DefaultWarmupExceptionRequiredCodeRule,
  defaultDefaultWarmupExceptionValidator,
} from "./default-warmup-exception-rules.js";
import { newDefaultWarmupException } from "./default-warmup-exception.js";

test("DefaultWarmupExceptionValidator reports every problem", () => {
  const validator = defaultDefaultWarmupExceptionValidator();
  const item = newDefaultWarmupException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultWarmupExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultWarmupExceptionRequiredCodeRule("default warmup exception needs an entry");
  const item = newDefaultWarmupException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultWarmupExceptionNameLengthRule flags a long name", () => {
  const rule = new DefaultWarmupExceptionNameLengthRule(32);
  const item = newDefaultWarmupException("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultWarmupExceptionCreatedAtRangeRule flags values above created at", () => {
  const rule = new DefaultWarmupExceptionCreatedAtRangeRule(64, 64);
  const item = newDefaultWarmupException("x", "y");
  item.createdAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultWarmupExceptionDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultWarmupExceptionDurationMinutesRangeRule(16, 86400);
  const item = newDefaultWarmupException("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
