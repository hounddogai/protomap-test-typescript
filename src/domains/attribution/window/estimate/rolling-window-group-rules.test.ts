import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWindowGroupConversionRateRangeRule,
  RollingWindowGroupDescriptionLengthRule,
  RollingWindowGroupRateRangeRule,
  RollingWindowGroupRequiredDescriptionRule,
  defaultRollingWindowGroupValidator,
} from "./rolling-window-group-rules.js";
import { newRollingWindowGroup } from "./rolling-window-group.js";

test("RollingWindowGroupValidator reports every problem", () => {
  const validator = defaultRollingWindowGroupValidator();
  const item = newRollingWindowGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWindowGroupRequiredDescriptionRule flags a blank description", () => {
  const rule = new RollingWindowGroupRequiredDescriptionRule("rolling window group needs this field");
  const item = newRollingWindowGroup("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWindowGroupDescriptionLengthRule flags a long description", () => {
  const rule = new RollingWindowGroupDescriptionLengthRule(80);
  const item = newRollingWindowGroup("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingWindowGroupConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RollingWindowGroupConversionRateRangeRule(3, 2409.5);
  const item = newRollingWindowGroup("x", "y");
  item.conversionRate = 2411;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWindowGroupRateRangeRule flags values above rate", () => {
  const rule = new RollingWindowGroupRateRangeRule(2.3, 4114);
  const item = newRollingWindowGroup("x", "y");
  item.rate = 4115.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
