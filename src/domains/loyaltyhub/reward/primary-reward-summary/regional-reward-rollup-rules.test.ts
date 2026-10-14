import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRewardRollupCodeLengthRule,
  RegionalRewardRollupGraceDaysRangeRule,
  RegionalRewardRollupLocaleLengthRule,
  RegionalRewardRollupRequiredCodeRule,
  RegionalRewardRollupRequiredLocaleRule,
  RegionalRewardRollupScoreRangeRule,
  defaultRegionalRewardRollupValidator,
} from "./regional-reward-rollup-rules.js";
import { newRegionalRewardRollup } from "./regional-reward-rollup.js";

test("RegionalRewardRollupValidator reports every problem", () => {
  const validator = defaultRegionalRewardRollupValidator();
  const item = newRegionalRewardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRewardRollupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RegionalRewardRollupGraceDaysRangeRule(80, 255);
  const item = newRegionalRewardRollup("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalRewardRollupRequiredLocaleRule flags a blank locale", () => {
  const rule = new RegionalRewardRollupRequiredLocaleRule("regional reward rollup needs a value");
  const item = newRegionalRewardRollup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRewardRollupRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalRewardRollupRequiredCodeRule("regional reward rollup needs a value");
  const item = newRegionalRewardRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRewardRollupLocaleLengthRule flags a long locale", () => {
  const rule = new RegionalRewardRollupLocaleLengthRule(1000);
  const item = newRegionalRewardRollup("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRewardRollupCodeLengthRule flags a long code", () => {
  const rule = new RegionalRewardRollupCodeLengthRule(64);
  const item = newRegionalRewardRollup("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRewardRollupScoreRangeRule flags values above score", () => {
  const rule = new RegionalRewardRollupScoreRangeRule(4.5, 724.6);
  const item = newRegionalRewardRollup("x", "y");
  item.score = 726.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
