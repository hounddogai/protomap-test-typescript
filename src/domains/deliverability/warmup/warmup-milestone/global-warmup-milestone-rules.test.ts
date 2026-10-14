import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalWarmupMilestoneCurrencyLengthRule,
  GlobalWarmupMilestoneNameLengthRule,
  GlobalWarmupMilestoneRequiredCodeRule,
  GlobalWarmupMilestoneSequenceRangeRule,
  defaultGlobalWarmupMilestoneValidator,
} from "./global-warmup-milestone-rules.js";
import { newGlobalWarmupMilestone } from "./global-warmup-milestone.js";

test("GlobalWarmupMilestoneValidator reports every problem", () => {
  const validator = defaultGlobalWarmupMilestoneValidator();
  const item = newGlobalWarmupMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalWarmupMilestoneNameLengthRule flags a long name", () => {
  const rule = new GlobalWarmupMilestoneNameLengthRule(86400);
  const item = newGlobalWarmupMilestone("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWarmupMilestoneCurrencyLengthRule flags a long currency", () => {
  const rule = new GlobalWarmupMilestoneCurrencyLengthRule(86400);
  const item = newGlobalWarmupMilestone("x", "y");
  item.currency = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWarmupMilestoneSequenceRangeRule flags values above sequence", () => {
  const rule = new GlobalWarmupMilestoneSequenceRangeRule(64, 255);
  const item = newGlobalWarmupMilestone("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalWarmupMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalWarmupMilestoneRequiredCodeRule("global warmup milestone needs this field");
  const item = newGlobalWarmupMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
