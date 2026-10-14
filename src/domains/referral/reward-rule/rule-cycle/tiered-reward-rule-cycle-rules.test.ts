import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardRuleCycleAudienceIdLengthRule,
  TieredRewardRuleCycleRateRangeRule,
  TieredRewardRuleCycleRequiredAudienceIdRule,
  TieredRewardRuleCycleRequiredCodeRule,
  TieredRewardRuleCycleRequiredNameRule,
  defaultTieredRewardRuleCycleValidator,
} from "./tiered-reward-rule-cycle-rules.js";
import { newTieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

test("TieredRewardRuleCycleValidator reports every problem", () => {
  const validator = defaultTieredRewardRuleCycleValidator();
  const item = newTieredRewardRuleCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardRuleCycleRateRangeRule flags values above rate", () => {
  const rule = new TieredRewardRuleCycleRateRangeRule(9.4, 2253.3);
  const item = newTieredRewardRuleCycle("x", "y");
  item.rate = 2254.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRewardRuleCycleRequiredNameRule flags a blank name", () => {
  const rule = new TieredRewardRuleCycleRequiredNameRule("tiered reward rule cycle needs an entry");
  const item = newTieredRewardRuleCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleCycleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new TieredRewardRuleCycleRequiredAudienceIdRule("tiered reward rule cycle needs a value");
  const item = newTieredRewardRuleCycle("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleCycleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new TieredRewardRuleCycleAudienceIdLengthRule(80);
  const item = newTieredRewardRuleCycle("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardRuleCycleRequiredCodeRule flags a blank code", () => {
  const rule = new TieredRewardRuleCycleRequiredCodeRule("tiered reward rule cycle needs a value");
  const item = newTieredRewardRuleCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
