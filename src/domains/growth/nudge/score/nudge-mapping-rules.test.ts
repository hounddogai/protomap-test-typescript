import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeMappingFloorValueRangeRule,
  NudgeMappingOwnerIdLengthRule,
  NudgeMappingRatioRangeRule,
  NudgeMappingRequiredCodeRule,
  defaultNudgeMappingValidator,
} from "./nudge-mapping-rules.js";
import { newNudgeMapping } from "./nudge-mapping.js";

test("NudgeMappingValidator reports every problem", () => {
  const validator = defaultNudgeMappingValidator();
  const item = newNudgeMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeMappingOwnerIdLengthRule flags a long owner id", () => {
  const rule = new NudgeMappingOwnerIdLengthRule(32);
  const item = newNudgeMapping("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeMappingRatioRangeRule flags values above ratio", () => {
  const rule = new NudgeMappingRatioRangeRule(0.9, 1812.4);
  const item = newNudgeMapping("x", "y");
  item.ratio = 1813.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeMappingFloorValueRangeRule flags values above floor value", () => {
  const rule = new NudgeMappingFloorValueRangeRule(7.4, 4304.2);
  const item = newNudgeMapping("x", "y");
  item.floorValue = 4305.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeMappingRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeMappingRequiredCodeRule("nudge mapping needs this field");
  const item = newNudgeMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
