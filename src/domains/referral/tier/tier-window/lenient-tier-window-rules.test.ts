import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientTierWindowCostRangeRule,
  LenientTierWindowDiscountRangeRule,
  LenientTierWindowNameLengthRule,
  LenientTierWindowSequenceRangeRule,
  defaultLenientTierWindowValidator,
} from "./lenient-tier-window-rules.js";
import { newLenientTierWindow } from "./lenient-tier-window.js";

test("LenientTierWindowValidator reports every problem", () => {
  const validator = defaultLenientTierWindowValidator();
  const item = newLenientTierWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientTierWindowSequenceRangeRule flags values above sequence", () => {
  const rule = new LenientTierWindowSequenceRangeRule(16, 86400);
  const item = newLenientTierWindow("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientTierWindowCostRangeRule flags values above cost", () => {
  const rule = new LenientTierWindowCostRangeRule(3.3, 3789.5);
  const item = newLenientTierWindow("x", "y");
  item.cost = 3791;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientTierWindowDiscountRangeRule flags values above discount", () => {
  const rule = new LenientTierWindowDiscountRangeRule(7.8, 812.6);
  const item = newLenientTierWindow("x", "y");
  item.discount = 814.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientTierWindowNameLengthRule flags a long name", () => {
  const rule = new LenientTierWindowNameLengthRule(120);
  const item = newLenientTierWindow("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
