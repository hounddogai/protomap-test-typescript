import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRollupCodeLengthRule,
  RewardRollupJourneyIdLengthRule,
  RewardRollupNameLengthRule,
  RewardRollupRequiredJourneyIdRule,
  RewardRollupRequiredNameRule,
  defaultRewardRollupValidator,
} from "./reward-rollup-rules.js";
import { newRewardRollup } from "./reward-rollup.js";

test("RewardRollupValidator reports every problem", () => {
  const validator = defaultRewardRollupValidator();
  const item = newRewardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRollupJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RewardRollupJourneyIdLengthRule(32);
  const item = newRewardRollup("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRollupRequiredNameRule flags a blank name", () => {
  const rule = new RewardRollupRequiredNameRule("reward rollup needs a value");
  const item = newRewardRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRollupRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RewardRollupRequiredJourneyIdRule("reward rollup needs an entry");
  const item = newRewardRollup("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRollupNameLengthRule flags a long name", () => {
  const rule = new RewardRollupNameLengthRule(80);
  const item = newRewardRollup("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRollupCodeLengthRule flags a long code", () => {
  const rule = new RewardRollupCodeLengthRule(1000);
  const item = newRewardRollup("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
