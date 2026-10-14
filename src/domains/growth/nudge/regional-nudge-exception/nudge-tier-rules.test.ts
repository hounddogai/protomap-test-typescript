import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeTierCodeLengthRule,
  NudgeTierFloorValueRangeRule,
  NudgeTierNameLengthRule,
  defaultNudgeTierValidator,
} from "./nudge-tier-rules.js";
import { newNudgeTier } from "./nudge-tier.js";

test("NudgeTierValidator reports every problem", () => {
  const validator = defaultNudgeTierValidator();
  const item = newNudgeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeTierFloorValueRangeRule flags values above floor value", () => {
  const rule = new NudgeTierFloorValueRangeRule(1.5, 377.7);
  const item = newNudgeTier("x", "y");
  item.floorValue = 379.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeTierNameLengthRule flags a long name", () => {
  const rule = new NudgeTierNameLengthRule(16);
  const item = newNudgeTier("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeTierCodeLengthRule flags a long code", () => {
  const rule = new NudgeTierCodeLengthRule(3600);
  const item = newNudgeTier("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
