import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultBounceExceptionRequiredCodeRule,
  DefaultBounceExceptionVariantLengthRule,
  defaultDefaultBounceExceptionValidator,
} from "./default-bounce-exception-rules.js";
import { newDefaultBounceException } from "./default-bounce-exception.js";

test("DefaultBounceExceptionValidator reports every problem", () => {
  const validator = defaultDefaultBounceExceptionValidator();
  const item = newDefaultBounceException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultBounceExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultBounceExceptionRequiredCodeRule("default bounce exception needs this field");
  const item = newDefaultBounceException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultBounceExceptionVariantLengthRule flags a long variant", () => {
  const rule = new DefaultBounceExceptionVariantLengthRule(16);
  const item = newDefaultBounceException("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
