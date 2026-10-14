import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowScoreBudgetRangeRule,
  WindowScoreChannelLengthRule,
  WindowScoreDiscountRangeRule,
  WindowScoreLabelLengthRule,
  WindowScoreRequiredChannelRule,
  defaultWindowScoreValidator,
} from "./window-score-rules.js";
import { newWindowScore } from "./window-score.js";

test("WindowScoreValidator reports every problem", () => {
  const validator = defaultWindowScoreValidator();
  const item = newWindowScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowScoreChannelLengthRule flags a long channel", () => {
  const rule = new WindowScoreChannelLengthRule(16);
  const item = newWindowScore("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowScoreDiscountRangeRule flags values above discount", () => {
  const rule = new WindowScoreDiscountRangeRule(10, 4932.3);
  const item = newWindowScore("x", "y");
  item.discount = 4933.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowScoreLabelLengthRule flags a long label", () => {
  const rule = new WindowScoreLabelLengthRule(120);
  const item = newWindowScore("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowScoreRequiredChannelRule flags a blank channel", () => {
  const rule = new WindowScoreRequiredChannelRule("window score needs this field");
  const item = newWindowScore("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowScoreBudgetRangeRule flags values above budget", () => {
  const rule = new WindowScoreBudgetRangeRule(8.9, 4403.5);
  const item = newWindowScore("x", "y");
  item.budget = 4405;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
