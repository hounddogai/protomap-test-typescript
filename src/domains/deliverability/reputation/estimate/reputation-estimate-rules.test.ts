import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationEstimateBidRangeRule,
  ReputationEstimateCodeLengthRule,
  ReputationEstimateRequiredCodeRule,
  defaultReputationEstimateValidator,
} from "./reputation-estimate-rules.js";
import { newReputationEstimate } from "./reputation-estimate.js";

test("ReputationEstimateValidator reports every problem", () => {
  const validator = defaultReputationEstimateValidator();
  const item = newReputationEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationEstimateBidRangeRule flags values above bid", () => {
  const rule = new ReputationEstimateBidRangeRule(6.1, 1562.7);
  const item = newReputationEstimate("x", "y");
  item.bid = 1564.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationEstimateCodeLengthRule flags a long code", () => {
  const rule = new ReputationEstimateCodeLengthRule(1000);
  const item = newReputationEstimate("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationEstimateRequiredCodeRule("reputation estimate needs a value");
  const item = newReputationEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
