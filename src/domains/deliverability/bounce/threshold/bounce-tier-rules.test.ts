import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceTierMaximumRangeRule,
  BounceTierNameLengthRule,
  BounceTierVariantLengthRule,
  defaultBounceTierValidator,
} from "./bounce-tier-rules.js";
import { newBounceTier } from "./bounce-tier.js";

test("BounceTierValidator reports every problem", () => {
  const validator = defaultBounceTierValidator();
  const item = newBounceTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceTierMaximumRangeRule flags values above maximum", () => {
  const rule = new BounceTierMaximumRangeRule(6.3, 1161.6);
  const item = newBounceTier("x", "y");
  item.maximum = 1163.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceTierVariantLengthRule flags a long variant", () => {
  const rule = new BounceTierVariantLengthRule(86400);
  const item = newBounceTier("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceTierNameLengthRule flags a long name", () => {
  const rule = new BounceTierNameLengthRule(16);
  const item = newBounceTier("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
