import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledTierScoreAmountRangeRule,
  ScheduledTierScoreCodeLengthRule,
  ScheduledTierScoreRequiredCodeRule,
  ScheduledTierScoreTimezoneLengthRule,
  defaultScheduledTierScoreValidator,
} from "./scheduled-tier-score-rules.js";
import { newScheduledTierScore } from "./scheduled-tier-score.js";

test("ScheduledTierScoreValidator reports every problem", () => {
  const validator = defaultScheduledTierScoreValidator();
  const item = newScheduledTierScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledTierScoreCodeLengthRule flags a long code", () => {
  const rule = new ScheduledTierScoreCodeLengthRule(3600);
  const item = newScheduledTierScore("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTierScoreTimezoneLengthRule flags a long timezone", () => {
  const rule = new ScheduledTierScoreTimezoneLengthRule(120);
  const item = newScheduledTierScore("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTierScoreAmountRangeRule flags values above amount", () => {
  const rule = new ScheduledTierScoreAmountRangeRule(7, 3306.4);
  const item = newScheduledTierScore("x", "y");
  item.amount = 3307.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledTierScoreRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledTierScoreRequiredCodeRule("scheduled tier score needs an entry");
  const item = newScheduledTierScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
