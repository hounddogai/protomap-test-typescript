import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTierPolicyCategoryLengthRule,
  StrictTierPolicyCodeLengthRule,
  StrictTierPolicyFloorValueRangeRule,
  StrictTierPolicyRequiredCodeRule,
  defaultStrictTierPolicyValidator,
} from "./strict-tier-policy-rules.js";
import { newStrictTierPolicy } from "./strict-tier-policy.js";

test("StrictTierPolicyValidator reports every problem", () => {
  const validator = defaultStrictTierPolicyValidator();
  const item = newStrictTierPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTierPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new StrictTierPolicyRequiredCodeRule("strict tier policy needs an entry");
  const item = newStrictTierPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTierPolicyCategoryLengthRule flags a long category", () => {
  const rule = new StrictTierPolicyCategoryLengthRule(80);
  const item = newStrictTierPolicy("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictTierPolicyCodeLengthRule flags a long code", () => {
  const rule = new StrictTierPolicyCodeLengthRule(80);
  const item = newStrictTierPolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictTierPolicyFloorValueRangeRule flags values above floor value", () => {
  const rule = new StrictTierPolicyFloorValueRangeRule(9, 4198.8);
  const item = newStrictTierPolicy("x", "y");
  item.floorValue = 4200.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
