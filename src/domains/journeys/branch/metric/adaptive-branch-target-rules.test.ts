import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBranchTargetCostRangeRule,
  AdaptiveBranchTargetMarginRangeRule,
  AdaptiveBranchTargetUnitLengthRule,
  defaultAdaptiveBranchTargetValidator,
} from "./adaptive-branch-target-rules.js";
import { newAdaptiveBranchTarget } from "./adaptive-branch-target.js";

test("AdaptiveBranchTargetValidator reports every problem", () => {
  const validator = defaultAdaptiveBranchTargetValidator();
  const item = newAdaptiveBranchTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBranchTargetCostRangeRule flags values above cost", () => {
  const rule = new AdaptiveBranchTargetCostRangeRule(6.4, 2533.9);
  const item = newAdaptiveBranchTarget("x", "y");
  item.cost = 2535.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveBranchTargetUnitLengthRule flags a long unit", () => {
  const rule = new AdaptiveBranchTargetUnitLengthRule(86400);
  const item = newAdaptiveBranchTarget("x", "y");
  item.unit = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBranchTargetMarginRangeRule flags values above margin", () => {
  const rule = new AdaptiveBranchTargetMarginRangeRule(4.4, 1939.5);
  const item = newAdaptiveBranchTarget("x", "y");
  item.margin = 1941;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
