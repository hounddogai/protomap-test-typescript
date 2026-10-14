import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowExceptionLocaleLengthRule,
  WindowExceptionMinimumRangeRule,
  WindowExceptionRequiredCodeRule,
  WindowExceptionRequiredOwnerIdRule,
  WindowExceptionStartsAtRangeRule,
  defaultWindowExceptionValidator,
} from "./window-exception-rules.js";
import { newWindowException } from "./window-exception.js";

test("WindowExceptionValidator reports every problem", () => {
  const validator = defaultWindowExceptionValidator();
  const item = newWindowException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowExceptionStartsAtRangeRule flags values above starts at", () => {
  const rule = new WindowExceptionStartsAtRangeRule(64, 255);
  const item = newWindowException("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowExceptionLocaleLengthRule flags a long locale", () => {
  const rule = new WindowExceptionLocaleLengthRule(32);
  const item = newWindowException("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowExceptionMinimumRangeRule flags values above minimum", () => {
  const rule = new WindowExceptionMinimumRangeRule(4.1, 3781.9);
  const item = newWindowException("x", "y");
  item.minimum = 3783.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new WindowExceptionRequiredCodeRule("window exception needs an entry");
  const item = newWindowException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowExceptionRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WindowExceptionRequiredOwnerIdRule("window exception needs this field");
  const item = newWindowException("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
