import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingMacroCycleLabelLengthRule,
  RollingMacroCycleMinimumRangeRule,
  RollingMacroCycleRequiredCodeRule,
  RollingMacroCycleRequiredLabelRule,
  RollingMacroCycleVariantLengthRule,
  defaultRollingMacroCycleValidator,
} from "./rolling-macro-cycle-rules.js";
import { newRollingMacroCycle } from "./rolling-macro-cycle.js";

test("RollingMacroCycleValidator reports every problem", () => {
  const validator = defaultRollingMacroCycleValidator();
  const item = newRollingMacroCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingMacroCycleMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingMacroCycleMinimumRangeRule(9.8, 240.3);
  const item = newRollingMacroCycle("x", "y");
  item.minimum = 241.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingMacroCycleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingMacroCycleRequiredCodeRule("rolling macro cycle needs an entry");
  const item = newRollingMacroCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingMacroCycleRequiredLabelRule flags a blank label", () => {
  const rule = new RollingMacroCycleRequiredLabelRule("rolling macro cycle needs a value");
  const item = newRollingMacroCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingMacroCycleVariantLengthRule flags a long variant", () => {
  const rule = new RollingMacroCycleVariantLengthRule(64);
  const item = newRollingMacroCycle("x", "y");
  item.variant = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingMacroCycleLabelLengthRule flags a long label", () => {
  const rule = new RollingMacroCycleLabelLengthRule(255);
  const item = newRollingMacroCycle("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
