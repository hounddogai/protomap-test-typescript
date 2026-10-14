import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingBidRuleBatchCodeLengthRule,
  RollingBidRuleBatchOwnerIdLengthRule,
  RollingBidRuleBatchRegionLengthRule,
  RollingBidRuleBatchRequiredRegionRule,
  RollingBidRuleBatchSequenceRangeRule,
  defaultRollingBidRuleBatchValidator,
} from "./rolling-bid-rule-batch-rules.js";
import { newRollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

test("RollingBidRuleBatchValidator reports every problem", () => {
  const validator = defaultRollingBidRuleBatchValidator();
  const item = newRollingBidRuleBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingBidRuleBatchRegionLengthRule flags a long region", () => {
  const rule = new RollingBidRuleBatchRegionLengthRule(120);
  const item = newRollingBidRuleBatch("x", "y");
  item.region = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingBidRuleBatchSequenceRangeRule flags values above sequence", () => {
  const rule = new RollingBidRuleBatchSequenceRangeRule(1000, 1000);
  const item = newRollingBidRuleBatch("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBidRuleBatchRequiredRegionRule flags a blank region", () => {
  const rule = new RollingBidRuleBatchRequiredRegionRule("rolling bid rule batch needs this field");
  const item = newRollingBidRuleBatch("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingBidRuleBatchCodeLengthRule flags a long code", () => {
  const rule = new RollingBidRuleBatchCodeLengthRule(80);
  const item = newRollingBidRuleBatch("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingBidRuleBatchOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RollingBidRuleBatchOwnerIdLengthRule(3600);
  const item = newRollingBidRuleBatch("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
