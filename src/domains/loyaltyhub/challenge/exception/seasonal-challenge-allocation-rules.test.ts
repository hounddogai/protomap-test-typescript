import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalChallengeAllocationCodeLengthRule,
  SeasonalChallengeAllocationFrequencyCapRangeRule,
  SeasonalChallengeAllocationRequiredRegionRule,
  SeasonalChallengeAllocationRevisionRangeRule,
  SeasonalChallengeAllocationVersionRangeRule,
  defaultSeasonalChallengeAllocationValidator,
} from "./seasonal-challenge-allocation-rules.js";
import { newSeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

test("SeasonalChallengeAllocationValidator reports every problem", () => {
  const validator = defaultSeasonalChallengeAllocationValidator();
  const item = newSeasonalChallengeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalChallengeAllocationRevisionRangeRule flags values above revision", () => {
  const rule = new SeasonalChallengeAllocationRevisionRangeRule(86400, 86400);
  const item = newSeasonalChallengeAllocation("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalChallengeAllocationFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new SeasonalChallengeAllocationFrequencyCapRangeRule(64, 86400);
  const item = newSeasonalChallengeAllocation("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalChallengeAllocationVersionRangeRule flags values above version", () => {
  const rule = new SeasonalChallengeAllocationVersionRangeRule(1000, 86400);
  const item = newSeasonalChallengeAllocation("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalChallengeAllocationCodeLengthRule flags a long code", () => {
  const rule = new SeasonalChallengeAllocationCodeLengthRule(86400);
  const item = newSeasonalChallengeAllocation("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalChallengeAllocationRequiredRegionRule flags a blank region", () => {
  const rule = new SeasonalChallengeAllocationRequiredRegionRule("seasonal challenge allocation needs a value");
  const item = newSeasonalChallengeAllocation("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
