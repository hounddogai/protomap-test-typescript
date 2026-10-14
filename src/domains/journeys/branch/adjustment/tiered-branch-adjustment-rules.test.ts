import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBranchAdjustmentCodeLengthRule,
  TieredBranchAdjustmentDurationMinutesRangeRule,
  TieredBranchAdjustmentLabelLengthRule,
  TieredBranchAdjustmentPriorityRangeRule,
  defaultTieredBranchAdjustmentValidator,
} from "./tiered-branch-adjustment-rules.js";
import { newTieredBranchAdjustment } from "./tiered-branch-adjustment.js";

test("TieredBranchAdjustmentValidator reports every problem", () => {
  const validator = defaultTieredBranchAdjustmentValidator();
  const item = newTieredBranchAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBranchAdjustmentPriorityRangeRule flags values above priority", () => {
  const rule = new TieredBranchAdjustmentPriorityRangeRule(80, 80);
  const item = newTieredBranchAdjustment("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBranchAdjustmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new TieredBranchAdjustmentDurationMinutesRangeRule(3600, 86400);
  const item = newTieredBranchAdjustment("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBranchAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new TieredBranchAdjustmentCodeLengthRule(120);
  const item = newTieredBranchAdjustment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBranchAdjustmentLabelLengthRule flags a long label", () => {
  const rule = new TieredBranchAdjustmentLabelLengthRule(80);
  const item = newTieredBranchAdjustment("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
