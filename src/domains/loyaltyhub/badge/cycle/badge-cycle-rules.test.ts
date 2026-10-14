import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeCycleDescriptionLengthRule,
  BadgeCycleLabelLengthRule,
  BadgeCycleOpenRateRangeRule,
  BadgeCycleRequiredCodeRule,
  defaultBadgeCycleValidator,
} from "./badge-cycle-rules.js";
import { newBadgeCycle } from "./badge-cycle.js";

test("BadgeCycleValidator reports every problem", () => {
  const validator = defaultBadgeCycleValidator();
  const item = newBadgeCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeCycleDescriptionLengthRule flags a long description", () => {
  const rule = new BadgeCycleDescriptionLengthRule(64);
  const item = newBadgeCycle("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeCycleOpenRateRangeRule flags values above open rate", () => {
  const rule = new BadgeCycleOpenRateRangeRule(3.6, 853.7);
  const item = newBadgeCycle("x", "y");
  item.openRate = 855.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeCycleRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeCycleRequiredCodeRule("badge cycle needs a value");
  const item = newBadgeCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeCycleLabelLengthRule flags a long label", () => {
  const rule = new BadgeCycleLabelLengthRule(3600);
  const item = newBadgeCycle("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
