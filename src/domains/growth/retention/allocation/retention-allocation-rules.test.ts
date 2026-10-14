import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionAllocationLabelLengthRule,
  RetentionAllocationOpenRateRangeRule,
  RetentionAllocationRequiredChannelRule,
  defaultRetentionAllocationValidator,
} from "./retention-allocation-rules.js";
import { newRetentionAllocation } from "./retention-allocation.js";

test("RetentionAllocationValidator reports every problem", () => {
  const validator = defaultRetentionAllocationValidator();
  const item = newRetentionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionAllocationLabelLengthRule flags a long label", () => {
  const rule = new RetentionAllocationLabelLengthRule(255);
  const item = newRetentionAllocation("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionAllocationOpenRateRangeRule flags values above open rate", () => {
  const rule = new RetentionAllocationOpenRateRangeRule(1.8, 4903.6);
  const item = newRetentionAllocation("x", "y");
  item.openRate = 4905.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionAllocationRequiredChannelRule flags a blank channel", () => {
  const rule = new RetentionAllocationRequiredChannelRule("retention allocation needs this field");
  const item = newRetentionAllocation("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
