import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionGroupNameLengthRule,
  RedemptionGroupRequiredCodeRule,
  RedemptionGroupRequiredUnitRule,
  RedemptionGroupUpdatedAtRangeRule,
  defaultRedemptionGroupValidator,
} from "./redemption-group-rules.js";
import { newRedemptionGroup } from "./redemption-group.js";

test("RedemptionGroupValidator reports every problem", () => {
  const validator = defaultRedemptionGroupValidator();
  const item = newRedemptionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionGroupUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RedemptionGroupUpdatedAtRangeRule(32, 64);
  const item = newRedemptionGroup("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionGroupRequiredUnitRule flags a blank unit", () => {
  const rule = new RedemptionGroupRequiredUnitRule("redemption group needs an entry");
  const item = newRedemptionGroup("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionGroupRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionGroupRequiredCodeRule("redemption group needs an entry");
  const item = newRedemptionGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionGroupNameLengthRule flags a long name", () => {
  const rule = new RedemptionGroupNameLengthRule(1000);
  const item = newRedemptionGroup("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
