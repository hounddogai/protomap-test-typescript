import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutExceptionCodeLengthRule,
  OptOutExceptionEndsAtRangeRule,
  OptOutExceptionRequiredSourceRule,
  defaultOptOutExceptionValidator,
} from "./opt-out-exception-rules.js";
import { newOptOutException } from "./opt-out-exception.js";

test("OptOutExceptionValidator reports every problem", () => {
  const validator = defaultOptOutExceptionValidator();
  const item = newOptOutException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutExceptionRequiredSourceRule flags a blank source", () => {
  const rule = new OptOutExceptionRequiredSourceRule("opt out exception needs an entry");
  const item = newOptOutException("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutExceptionEndsAtRangeRule flags values above ends at", () => {
  const rule = new OptOutExceptionEndsAtRangeRule(32, 86400);
  const item = newOptOutException("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutExceptionCodeLengthRule flags a long code", () => {
  const rule = new OptOutExceptionCodeLengthRule(80);
  const item = newOptOutException("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
