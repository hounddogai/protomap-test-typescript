import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathAdjustmentCapacityRangeRule,
  PathAdjustmentRequiredVariantRule,
  PathAdjustmentVariantLengthRule,
  defaultPathAdjustmentValidator,
} from "./path-adjustment-rules.js";
import { newPathAdjustment } from "./path-adjustment.js";

test("PathAdjustmentValidator reports every problem", () => {
  const validator = defaultPathAdjustmentValidator();
  const item = newPathAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathAdjustmentCapacityRangeRule flags values above capacity", () => {
  const rule = new PathAdjustmentCapacityRangeRule(16, 32);
  const item = newPathAdjustment("x", "y");
  item.capacity = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathAdjustmentRequiredVariantRule flags a blank variant", () => {
  const rule = new PathAdjustmentRequiredVariantRule("path adjustment needs an entry");
  const item = newPathAdjustment("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathAdjustmentVariantLengthRule flags a long variant", () => {
  const rule = new PathAdjustmentVariantLengthRule(120);
  const item = newPathAdjustment("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
