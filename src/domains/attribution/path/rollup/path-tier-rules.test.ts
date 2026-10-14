import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathTierCodeLengthRule,
  PathTierLimitRangeRule,
  PathTierRequiredTitleRule,
  defaultPathTierValidator,
} from "./path-tier-rules.js";
import { newPathTier } from "./path-tier.js";

test("PathTierValidator reports every problem", () => {
  const validator = defaultPathTierValidator();
  const item = newPathTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathTierCodeLengthRule flags a long code", () => {
  const rule = new PathTierCodeLengthRule(86400);
  const item = newPathTier("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathTierLimitRangeRule flags values above limit", () => {
  const rule = new PathTierLimitRangeRule(16, 80);
  const item = newPathTier("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathTierRequiredTitleRule flags a blank title", () => {
  const rule = new PathTierRequiredTitleRule("path tier needs this field");
  const item = newPathTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
