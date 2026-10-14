import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchAdjustmentCodeLengthRule,
  BranchAdjustmentMarginRangeRule,
  BranchAdjustmentRequiredUtmSourceRule,
  defaultBranchAdjustmentValidator,
} from "./branch-adjustment-rules.js";
import { newBranchAdjustment } from "./branch-adjustment.js";

test("BranchAdjustmentValidator reports every problem", () => {
  const validator = defaultBranchAdjustmentValidator();
  const item = newBranchAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new BranchAdjustmentCodeLengthRule(3600);
  const item = newBranchAdjustment("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchAdjustmentMarginRangeRule flags values above margin", () => {
  const rule = new BranchAdjustmentMarginRangeRule(1.6, 2272.3);
  const item = newBranchAdjustment("x", "y");
  item.margin = 2273.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchAdjustmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BranchAdjustmentRequiredUtmSourceRule("branch adjustment needs an entry");
  const item = newBranchAdjustment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
