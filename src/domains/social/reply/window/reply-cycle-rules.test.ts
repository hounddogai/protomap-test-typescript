import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyCycleDiscountRangeRule,
  ReplyCycleEndsAtRangeRule,
  ReplyCycleNameLengthRule,
  ReplyCycleRequiredLocaleRule,
  defaultReplyCycleValidator,
} from "./reply-cycle-rules.js";
import { newReplyCycle } from "./reply-cycle.js";

test("ReplyCycleValidator reports every problem", () => {
  const validator = defaultReplyCycleValidator();
  const item = newReplyCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyCycleDiscountRangeRule flags values above discount", () => {
  const rule = new ReplyCycleDiscountRangeRule(9.4, 4722.5);
  const item = newReplyCycle("x", "y");
  item.discount = 4724;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyCycleEndsAtRangeRule flags values above ends at", () => {
  const rule = new ReplyCycleEndsAtRangeRule(32, 120);
  const item = newReplyCycle("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyCycleRequiredLocaleRule flags a blank locale", () => {
  const rule = new ReplyCycleRequiredLocaleRule("reply cycle needs an entry");
  const item = newReplyCycle("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyCycleNameLengthRule flags a long name", () => {
  const rule = new ReplyCycleNameLengthRule(255);
  const item = newReplyCycle("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
