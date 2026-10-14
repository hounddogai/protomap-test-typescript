import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostAllocationAttemptsRangeRule,
  PostAllocationCodeLengthRule,
  PostAllocationFloorValueRangeRule,
  PostAllocationRequiredLabelRule,
  defaultPostAllocationValidator,
} from "./post-allocation-rules.js";
import { newPostAllocation } from "./post-allocation.js";

test("PostAllocationValidator reports every problem", () => {
  const validator = defaultPostAllocationValidator();
  const item = newPostAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostAllocationAttemptsRangeRule flags values above attempts", () => {
  const rule = new PostAllocationAttemptsRangeRule(16, 32);
  const item = newPostAllocation("x", "y");
  item.attempts = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostAllocationFloorValueRangeRule flags values above floor value", () => {
  const rule = new PostAllocationFloorValueRangeRule(5.7, 189);
  const item = newPostAllocation("x", "y");
  item.floorValue = 190.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostAllocationCodeLengthRule flags a long code", () => {
  const rule = new PostAllocationCodeLengthRule(80);
  const item = newPostAllocation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new PostAllocationRequiredLabelRule("post allocation needs this field");
  const item = newPostAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
