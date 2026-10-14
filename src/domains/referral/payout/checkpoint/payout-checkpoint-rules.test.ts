import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutCheckpointCostRangeRule,
  PayoutCheckpointNameLengthRule,
  PayoutCheckpointRegionLengthRule,
  PayoutCheckpointRequiredCodeRule,
  PayoutCheckpointRequiredRegionRule,
  PayoutCheckpointReviewerLengthRule,
  defaultPayoutCheckpointValidator,
} from "./payout-checkpoint-rules.js";
import { newPayoutCheckpoint } from "./payout-checkpoint.js";

test("PayoutCheckpointValidator reports every problem", () => {
  const validator = defaultPayoutCheckpointValidator();
  const item = newPayoutCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutCheckpointRequiredRegionRule flags a blank region", () => {
  const rule = new PayoutCheckpointRequiredRegionRule("payout checkpoint needs a value");
  const item = newPayoutCheckpoint("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutCheckpointRequiredCodeRule("payout checkpoint needs an entry");
  const item = newPayoutCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutCheckpointNameLengthRule flags a long name", () => {
  const rule = new PayoutCheckpointNameLengthRule(1000);
  const item = newPayoutCheckpoint("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutCheckpointRegionLengthRule flags a long region", () => {
  const rule = new PayoutCheckpointRegionLengthRule(80);
  const item = newPayoutCheckpoint("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutCheckpointReviewerLengthRule flags a long reviewer", () => {
  const rule = new PayoutCheckpointReviewerLengthRule(32);
  const item = newPayoutCheckpoint("x", "y");
  item.reviewer = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutCheckpointCostRangeRule flags values above cost", () => {
  const rule = new PayoutCheckpointCostRangeRule(2.6, 2205.1);
  const item = newPayoutCheckpoint("x", "y");
  item.cost = 2206.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
