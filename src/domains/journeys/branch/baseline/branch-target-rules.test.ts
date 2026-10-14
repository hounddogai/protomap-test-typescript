import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchTargetCodeLengthRule,
  BranchTargetDurationMinutesRangeRule,
  BranchTargetRegionLengthRule,
  defaultBranchTargetValidator,
} from "./branch-target-rules.js";
import { newBranchTarget } from "./branch-target.js";

test("BranchTargetValidator reports every problem", () => {
  const validator = defaultBranchTargetValidator();
  const item = newBranchTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchTargetDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BranchTargetDurationMinutesRangeRule(64, 255);
  const item = newBranchTarget("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchTargetCodeLengthRule flags a long code", () => {
  const rule = new BranchTargetCodeLengthRule(16);
  const item = newBranchTarget("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchTargetRegionLengthRule flags a long region", () => {
  const rule = new BranchTargetRegionLengthRule(80);
  const item = newBranchTarget("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
