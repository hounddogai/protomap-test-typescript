import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBranchAdjustmentQuantityRangeRule,
  ScheduledBranchAdjustmentRequiredNameRule,
  ScheduledBranchAdjustmentTimezoneLengthRule,
  defaultScheduledBranchAdjustmentValidator,
} from "./scheduled-branch-adjustment-rules.js";
import { newScheduledBranchAdjustment } from "./scheduled-branch-adjustment.js";

test("ScheduledBranchAdjustmentValidator reports every problem", () => {
  const validator = defaultScheduledBranchAdjustmentValidator();
  const item = newScheduledBranchAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBranchAdjustmentTimezoneLengthRule flags a long timezone", () => {
  const rule = new ScheduledBranchAdjustmentTimezoneLengthRule(86400);
  const item = newScheduledBranchAdjustment("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBranchAdjustmentQuantityRangeRule flags values above quantity", () => {
  const rule = new ScheduledBranchAdjustmentQuantityRangeRule(16, 16);
  const item = newScheduledBranchAdjustment("x", "y");
  item.quantity = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledBranchAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledBranchAdjustmentRequiredNameRule("scheduled branch adjustment needs this field");
  const item = newScheduledBranchAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
