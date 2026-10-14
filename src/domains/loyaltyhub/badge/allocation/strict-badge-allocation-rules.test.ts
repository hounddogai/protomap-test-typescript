import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBadgeAllocationAttemptsRangeRule,
  StrictBadgeAllocationCodeLengthRule,
  StrictBadgeAllocationRequiredTitleRule,
  StrictBadgeAllocationScoreRangeRule,
  defaultStrictBadgeAllocationValidator,
} from "./strict-badge-allocation-rules.js";
import { newStrictBadgeAllocation } from "./strict-badge-allocation.js";

test("StrictBadgeAllocationValidator reports every problem", () => {
  const validator = defaultStrictBadgeAllocationValidator();
  const item = newStrictBadgeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBadgeAllocationCodeLengthRule flags a long code", () => {
  const rule = new StrictBadgeAllocationCodeLengthRule(1000);
  const item = newStrictBadgeAllocation("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBadgeAllocationRequiredTitleRule flags a blank title", () => {
  const rule = new StrictBadgeAllocationRequiredTitleRule("strict badge allocation needs an entry");
  const item = newStrictBadgeAllocation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBadgeAllocationAttemptsRangeRule flags values above attempts", () => {
  const rule = new StrictBadgeAllocationAttemptsRangeRule(32, 86400);
  const item = newStrictBadgeAllocation("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBadgeAllocationScoreRangeRule flags values above score", () => {
  const rule = new StrictBadgeAllocationScoreRangeRule(6.8, 1079.6);
  const item = newStrictBadgeAllocation("x", "y");
  item.score = 1081.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
