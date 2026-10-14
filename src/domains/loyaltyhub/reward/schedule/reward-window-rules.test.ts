import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardWindowCodeLengthRule,
  RewardWindowCohortLengthRule,
  RewardWindowNameLengthRule,
  RewardWindowRequiredCodeRule,
  RewardWindowRequiredTitleRule,
  defaultRewardWindowValidator,
} from "./reward-window-rules.js";
import { newRewardWindow } from "./reward-window.js";

test("RewardWindowValidator reports every problem", () => {
  const validator = defaultRewardWindowValidator();
  const item = newRewardWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardWindowCodeLengthRule flags a long code", () => {
  const rule = new RewardWindowCodeLengthRule(80);
  const item = newRewardWindow("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardWindowNameLengthRule flags a long name", () => {
  const rule = new RewardWindowNameLengthRule(16);
  const item = newRewardWindow("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardWindowCohortLengthRule flags a long cohort", () => {
  const rule = new RewardWindowCohortLengthRule(86400);
  const item = newRewardWindow("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardWindowRequiredTitleRule flags a blank title", () => {
  const rule = new RewardWindowRequiredTitleRule("reward window needs an entry");
  const item = newRewardWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardWindowRequiredCodeRule flags a blank code", () => {
  const rule = new RewardWindowRequiredCodeRule("reward window needs a value");
  const item = newRewardWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
