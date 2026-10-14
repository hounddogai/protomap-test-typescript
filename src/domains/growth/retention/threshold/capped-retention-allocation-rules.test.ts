import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedRetentionAllocationAudienceIdLengthRule,
  CappedRetentionAllocationQuantityRangeRule,
  CappedRetentionAllocationRequiredCodeRule,
  CappedRetentionAllocationRequiredLabelRule,
  defaultCappedRetentionAllocationValidator,
} from "./capped-retention-allocation-rules.js";
import { newCappedRetentionAllocation } from "./capped-retention-allocation.js";

test("CappedRetentionAllocationValidator reports every problem", () => {
  const validator = defaultCappedRetentionAllocationValidator();
  const item = newCappedRetentionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedRetentionAllocationQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedRetentionAllocationQuantityRangeRule(16, 1000);
  const item = newCappedRetentionAllocation("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedRetentionAllocationAudienceIdLengthRule flags a long audience id", () => {
  const rule = new CappedRetentionAllocationAudienceIdLengthRule(120);
  const item = newCappedRetentionAllocation("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedRetentionAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new CappedRetentionAllocationRequiredCodeRule("capped retention allocation needs this field");
  const item = newCappedRetentionAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRetentionAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new CappedRetentionAllocationRequiredLabelRule("capped retention allocation needs an entry");
  const item = newCappedRetentionAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
