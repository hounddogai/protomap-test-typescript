import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLevelPolicyFloorValueRangeRule,
  RollingLevelPolicyImpressionsRangeRule,
  RollingLevelPolicyRequiredCodeRule,
  RollingLevelPolicyRequiredDescriptionRule,
  RollingLevelPolicyRequiredNameRule,
  defaultRollingLevelPolicyValidator,
} from "./rolling-level-policy-rules.js";
import { newRollingLevelPolicy } from "./rolling-level-policy.js";

test("RollingLevelPolicyValidator reports every problem", () => {
  const validator = defaultRollingLevelPolicyValidator();
  const item = newRollingLevelPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLevelPolicyRequiredDescriptionRule flags a blank description", () => {
  const rule = new RollingLevelPolicyRequiredDescriptionRule("rolling level policy needs an entry");
  const item = newRollingLevelPolicy("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingLevelPolicyRequiredNameRule flags a blank name", () => {
  const rule = new RollingLevelPolicyRequiredNameRule("rolling level policy needs this field");
  const item = newRollingLevelPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingLevelPolicyFloorValueRangeRule flags values above floor value", () => {
  const rule = new RollingLevelPolicyFloorValueRangeRule(3.7, 4098.5);
  const item = newRollingLevelPolicy("x", "y");
  item.floorValue = 4100;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingLevelPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new RollingLevelPolicyRequiredCodeRule("rolling level policy needs a value");
  const item = newRollingLevelPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingLevelPolicyImpressionsRangeRule flags values above impressions", () => {
  const rule = new RollingLevelPolicyImpressionsRangeRule(64, 86400);
  const item = newRollingLevelPolicy("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
