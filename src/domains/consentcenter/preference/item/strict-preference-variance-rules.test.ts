import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPreferenceVarianceDiscountRangeRule,
  StrictPreferenceVarianceRequiredOwnerIdRule,
  StrictPreferenceVarianceUpdatedAtRangeRule,
  defaultStrictPreferenceVarianceValidator,
} from "./strict-preference-variance-rules.js";
import { newStrictPreferenceVariance } from "./strict-preference-variance.js";

test("StrictPreferenceVarianceValidator reports every problem", () => {
  const validator = defaultStrictPreferenceVarianceValidator();
  const item = newStrictPreferenceVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPreferenceVarianceDiscountRangeRule flags values above discount", () => {
  const rule = new StrictPreferenceVarianceDiscountRangeRule(7.7, 4709);
  const item = newStrictPreferenceVariance("x", "y");
  item.discount = 4710.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPreferenceVarianceUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictPreferenceVarianceUpdatedAtRangeRule(16, 1000);
  const item = newStrictPreferenceVariance("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPreferenceVarianceRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StrictPreferenceVarianceRequiredOwnerIdRule("strict preference variance needs this field");
  const item = newStrictPreferenceVariance("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
