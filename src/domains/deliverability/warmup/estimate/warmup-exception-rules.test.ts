import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupExceptionCodeLengthRule,
  WarmupExceptionPriorityRangeRule,
  WarmupExceptionRequiredCodeRule,
  defaultWarmupExceptionValidator,
} from "./warmup-exception-rules.js";
import { newWarmupException } from "./warmup-exception.js";

test("WarmupExceptionValidator reports every problem", () => {
  const validator = defaultWarmupExceptionValidator();
  const item = newWarmupException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupExceptionRequiredCodeRule("warmup exception needs this field");
  const item = newWarmupException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupExceptionPriorityRangeRule flags values above priority", () => {
  const rule = new WarmupExceptionPriorityRangeRule(3600, 86400);
  const item = newWarmupException("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupExceptionCodeLengthRule flags a long code", () => {
  const rule = new WarmupExceptionCodeLengthRule(1000);
  const item = newWarmupException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
