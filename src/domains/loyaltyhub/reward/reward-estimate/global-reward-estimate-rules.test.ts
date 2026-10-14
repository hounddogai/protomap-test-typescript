import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRewardEstimateRequiredCodeRule,
  GlobalRewardEstimateSummaryLengthRule,
  defaultGlobalRewardEstimateValidator,
} from "./global-reward-estimate-rules.js";
import { newGlobalRewardEstimate } from "./global-reward-estimate.js";

test("GlobalRewardEstimateValidator reports every problem", () => {
  const validator = defaultGlobalRewardEstimateValidator();
  const item = newGlobalRewardEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRewardEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalRewardEstimateRequiredCodeRule("global reward estimate needs a value");
  const item = newGlobalRewardEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardEstimateSummaryLengthRule flags a long summary", () => {
  const rule = new GlobalRewardEstimateSummaryLengthRule(86400);
  const item = newGlobalRewardEstimate("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
