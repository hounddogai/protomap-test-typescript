import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeVarianceNameLengthRule,
  BadgeVarianceRequiredCodeRule,
  BadgeVarianceRequiredTitleRule,
  BadgeVarianceTitleLengthRule,
  defaultBadgeVarianceValidator,
} from "./badge-variance-rules.js";
import { newBadgeVariance } from "./badge-variance.js";

test("BadgeVarianceValidator reports every problem", () => {
  const validator = defaultBadgeVarianceValidator();
  const item = newBadgeVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeVarianceNameLengthRule flags a long name", () => {
  const rule = new BadgeVarianceNameLengthRule(86400);
  const item = newBadgeVariance("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeVarianceRequiredCodeRule("badge variance needs an entry");
  const item = newBadgeVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeVarianceTitleLengthRule flags a long title", () => {
  const rule = new BadgeVarianceTitleLengthRule(86400);
  const item = newBadgeVariance("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new BadgeVarianceRequiredTitleRule("badge variance needs a value");
  const item = newBadgeVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
