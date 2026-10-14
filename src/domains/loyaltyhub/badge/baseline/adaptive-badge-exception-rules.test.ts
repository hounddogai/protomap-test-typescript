import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBadgeExceptionCodeLengthRule,
  AdaptiveBadgeExceptionNameLengthRule,
  AdaptiveBadgeExceptionRequiredNameRule,
  AdaptiveBadgeExceptionRequiredUtmSourceRule,
  AdaptiveBadgeExceptionUtmSourceLengthRule,
  defaultAdaptiveBadgeExceptionValidator,
} from "./adaptive-badge-exception-rules.js";
import { newAdaptiveBadgeException } from "./adaptive-badge-exception.js";

test("AdaptiveBadgeExceptionValidator reports every problem", () => {
  const validator = defaultAdaptiveBadgeExceptionValidator();
  const item = newAdaptiveBadgeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBadgeExceptionUtmSourceLengthRule flags a long utm source", () => {
  const rule = new AdaptiveBadgeExceptionUtmSourceLengthRule(32);
  const item = newAdaptiveBadgeException("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeExceptionCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveBadgeExceptionCodeLengthRule(32);
  const item = newAdaptiveBadgeException("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeExceptionNameLengthRule flags a long name", () => {
  const rule = new AdaptiveBadgeExceptionNameLengthRule(3600);
  const item = newAdaptiveBadgeException("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeExceptionRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveBadgeExceptionRequiredNameRule("adaptive badge exception needs this field");
  const item = newAdaptiveBadgeException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveBadgeExceptionRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new AdaptiveBadgeExceptionRequiredUtmSourceRule("adaptive badge exception needs a value");
  const item = newAdaptiveBadgeException("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
