import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchDigestBatchSizeRangeRule,
  BranchDigestCeilingRangeRule,
  BranchDigestChannelLengthRule,
  BranchDigestRequiredLabelRule,
  BranchDigestRequiredUnitRule,
  defaultBranchDigestValidator,
} from "./branch-digest-rules.js";
import { newBranchDigest } from "./branch-digest.js";

test("BranchDigestValidator reports every problem", () => {
  const validator = defaultBranchDigestValidator();
  const item = newBranchDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchDigestRequiredLabelRule flags a blank label", () => {
  const rule = new BranchDigestRequiredLabelRule("branch digest needs a value");
  const item = newBranchDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchDigestCeilingRangeRule flags values above ceiling", () => {
  const rule = new BranchDigestCeilingRangeRule(7.9, 2325.8);
  const item = newBranchDigest("x", "y");
  item.ceiling = 2327.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchDigestRequiredUnitRule flags a blank unit", () => {
  const rule = new BranchDigestRequiredUnitRule("branch digest needs this field");
  const item = newBranchDigest("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchDigestChannelLengthRule flags a long channel", () => {
  const rule = new BranchDigestChannelLengthRule(255);
  const item = newBranchDigest("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchDigestBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BranchDigestBatchSizeRangeRule(64, 3600);
  const item = newBranchDigest("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
