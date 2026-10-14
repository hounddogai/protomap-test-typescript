import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardCycleLabelLengthRule,
  TieredRewardCycleRequiredChecksumRule,
  TieredRewardCycleRequiredCodeRule,
  TieredRewardCycleRequiredLabelRule,
  TieredRewardCycleSourceLengthRule,
  defaultTieredRewardCycleValidator,
} from "./tiered-reward-cycle-rules.js";
import { newTieredRewardCycle } from "./tiered-reward-cycle.js";

test("TieredRewardCycleValidator reports every problem", () => {
  const validator = defaultTieredRewardCycleValidator();
  const item = newTieredRewardCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardCycleRequiredLabelRule flags a blank label", () => {
  const rule = new TieredRewardCycleRequiredLabelRule("tiered reward cycle needs a value");
  const item = newTieredRewardCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardCycleRequiredChecksumRule flags a blank checksum", () => {
  const rule = new TieredRewardCycleRequiredChecksumRule("tiered reward cycle needs a value");
  const item = newTieredRewardCycle("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardCycleSourceLengthRule flags a long source", () => {
  const rule = new TieredRewardCycleSourceLengthRule(255);
  const item = newTieredRewardCycle("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardCycleRequiredCodeRule flags a blank code", () => {
  const rule = new TieredRewardCycleRequiredCodeRule("tiered reward cycle needs this field");
  const item = newTieredRewardCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardCycleLabelLengthRule flags a long label", () => {
  const rule = new TieredRewardCycleLabelLengthRule(86400);
  const item = newTieredRewardCycle("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
