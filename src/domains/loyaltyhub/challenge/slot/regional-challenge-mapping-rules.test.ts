import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalChallengeMappingBatchSizeRangeRule,
  RegionalChallengeMappingMinimumRangeRule,
  RegionalChallengeMappingRequiredCodeRule,
  defaultRegionalChallengeMappingValidator,
} from "./regional-challenge-mapping-rules.js";
import { newRegionalChallengeMapping } from "./regional-challenge-mapping.js";

test("RegionalChallengeMappingValidator reports every problem", () => {
  const validator = defaultRegionalChallengeMappingValidator();
  const item = newRegionalChallengeMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalChallengeMappingRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalChallengeMappingRequiredCodeRule("regional challenge mapping needs this field");
  const item = newRegionalChallengeMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalChallengeMappingMinimumRangeRule flags values above minimum", () => {
  const rule = new RegionalChallengeMappingMinimumRangeRule(4.9, 3780.6);
  const item = newRegionalChallengeMapping("x", "y");
  item.minimum = 3782.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalChallengeMappingBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RegionalChallengeMappingBatchSizeRangeRule(3600, 86400);
  const item = newRegionalChallengeMapping("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
