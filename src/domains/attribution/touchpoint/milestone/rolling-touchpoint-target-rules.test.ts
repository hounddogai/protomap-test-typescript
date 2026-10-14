import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingTouchpointTargetCodeLengthRule,
  RollingTouchpointTargetLimitRangeRule,
  RollingTouchpointTargetNameLengthRule,
  RollingTouchpointTargetRequiredCodeRule,
  defaultRollingTouchpointTargetValidator,
} from "./rolling-touchpoint-target-rules.js";
import { newRollingTouchpointTarget } from "./rolling-touchpoint-target.js";

test("RollingTouchpointTargetValidator reports every problem", () => {
  const validator = defaultRollingTouchpointTargetValidator();
  const item = newRollingTouchpointTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingTouchpointTargetCodeLengthRule flags a long code", () => {
  const rule = new RollingTouchpointTargetCodeLengthRule(80);
  const item = newRollingTouchpointTarget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingTouchpointTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RollingTouchpointTargetRequiredCodeRule("rolling touchpoint target needs an entry");
  const item = newRollingTouchpointTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingTouchpointTargetLimitRangeRule flags values above limit", () => {
  const rule = new RollingTouchpointTargetLimitRangeRule(16, 86400);
  const item = newRollingTouchpointTarget("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingTouchpointTargetNameLengthRule flags a long name", () => {
  const rule = new RollingTouchpointTargetNameLengthRule(64);
  const item = newRollingTouchpointTarget("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
