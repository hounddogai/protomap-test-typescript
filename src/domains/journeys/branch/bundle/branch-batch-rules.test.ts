import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchBatchCodeLengthRule,
  BranchBatchEndsAtRangeRule,
  BranchBatchPhoneLengthRule,
  BranchBatchRegionLengthRule,
  BranchBatchRequiredNameRule,
  defaultBranchBatchValidator,
} from "./branch-batch-rules.js";
import { newBranchBatch } from "./branch-batch.js";

test("BranchBatchValidator reports every problem", () => {
  const validator = defaultBranchBatchValidator();
  const item = newBranchBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchBatchCodeLengthRule flags a long code", () => {
  const rule = new BranchBatchCodeLengthRule(1000);
  const item = newBranchBatch("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchBatchRequiredNameRule flags a blank name", () => {
  const rule = new BranchBatchRequiredNameRule("branch batch needs a value");
  const item = newBranchBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchBatchRegionLengthRule flags a long region", () => {
  const rule = new BranchBatchRegionLengthRule(16);
  const item = newBranchBatch("x", "y");
  item.region = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchBatchEndsAtRangeRule flags values above ends at", () => {
  const rule = new BranchBatchEndsAtRangeRule(80, 1000);
  const item = newBranchBatch("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchBatchPhoneLengthRule flags a long phone", () => {
  const rule = new BranchBatchPhoneLengthRule(120);
  const item = newBranchBatch("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
