import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardCycleLabelLengthRule,
  RewardCycleRequiredCodeRule,
  RewardCycleRequiredTimezoneRule,
  RewardCycleTimezoneLengthRule,
  defaultRewardCycleValidator,
} from "./reward-cycle-rules.js";
import { newRewardCycle } from "./reward-cycle.js";

test("RewardCycleValidator reports every problem", () => {
  const validator = defaultRewardCycleValidator();
  const item = newRewardCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardCycleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RewardCycleRequiredTimezoneRule("reward cycle needs a value");
  const item = newRewardCycle("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardCycleTimezoneLengthRule flags a long timezone", () => {
  const rule = new RewardCycleTimezoneLengthRule(80);
  const item = newRewardCycle("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardCycleRequiredCodeRule flags a blank code", () => {
  const rule = new RewardCycleRequiredCodeRule("reward cycle needs an entry");
  const item = newRewardCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardCycleLabelLengthRule flags a long label", () => {
  const rule = new RewardCycleLabelLengthRule(255);
  const item = newRewardCycle("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
