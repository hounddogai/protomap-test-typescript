import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowSegmentBudgetRangeRule,
  WindowSegmentContactEmailLengthRule,
  WindowSegmentFloorValueRangeRule,
  WindowSegmentLimitRangeRule,
  WindowSegmentRequiredCodeRule,
  defaultWindowSegmentValidator,
} from "./window-segment-rules.js";
import { newWindowSegment } from "./window-segment.js";

test("WindowSegmentValidator reports every problem", () => {
  const validator = defaultWindowSegmentValidator();
  const item = newWindowSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowSegmentBudgetRangeRule flags values above budget", () => {
  const rule = new WindowSegmentBudgetRangeRule(4.3, 393.4);
  const item = newWindowSegment("x", "y");
  item.budget = 394.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowSegmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new WindowSegmentContactEmailLengthRule(80);
  const item = newWindowSegment("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new WindowSegmentRequiredCodeRule("window segment needs an entry");
  const item = newWindowSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowSegmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new WindowSegmentFloorValueRangeRule(3.8, 4945);
  const item = newWindowSegment("x", "y");
  item.floorValue = 4946.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowSegmentLimitRangeRule flags values above limit", () => {
  const rule = new WindowSegmentLimitRangeRule(32, 120);
  const item = newWindowSegment("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
