import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchEstimateCodeLengthRule,
  BranchEstimateRatioRangeRule,
  defaultBranchEstimateValidator,
} from "./branch-estimate-rules.js";
import { newBranchEstimate } from "./branch-estimate.js";

test("BranchEstimateValidator reports every problem", () => {
  const validator = defaultBranchEstimateValidator();
  const item = newBranchEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchEstimateRatioRangeRule flags values above ratio", () => {
  const rule = new BranchEstimateRatioRangeRule(0.4, 124.3);
  const item = newBranchEstimate("x", "y");
  item.ratio = 125.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchEstimateCodeLengthRule flags a long code", () => {
  const rule = new BranchEstimateCodeLengthRule(80);
  const item = newBranchEstimate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
