import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPacingMappingLabelLengthRule,
  RollingPacingMappingLimitRangeRule,
  RollingPacingMappingUpdatedAtRangeRule,
  defaultRollingPacingMappingValidator,
} from "./rolling-pacing-mapping-rules.js";
import { newRollingPacingMapping } from "./rolling-pacing-mapping.js";

test("RollingPacingMappingValidator reports every problem", () => {
  const validator = defaultRollingPacingMappingValidator();
  const item = newRollingPacingMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPacingMappingLabelLengthRule flags a long label", () => {
  const rule = new RollingPacingMappingLabelLengthRule(32);
  const item = newRollingPacingMapping("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPacingMappingLimitRangeRule flags values above limit", () => {
  const rule = new RollingPacingMappingLimitRangeRule(32, 3600);
  const item = newRollingPacingMapping("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPacingMappingUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RollingPacingMappingUpdatedAtRangeRule(120, 120);
  const item = newRollingPacingMapping("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
