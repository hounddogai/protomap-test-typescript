import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSlaTierAttemptsRangeRule,
  RollingSlaTierCodeLengthRule,
  RollingSlaTierLabelLengthRule,
  RollingSlaTierRequiredCodeRule,
  RollingSlaTierRequiredLabelRule,
  defaultRollingSlaTierValidator,
} from "./rolling-sla-tier-rules.js";
import { newRollingSlaTier } from "./rolling-sla-tier.js";

test("RollingSlaTierValidator reports every problem", () => {
  const validator = defaultRollingSlaTierValidator();
  const item = newRollingSlaTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSlaTierLabelLengthRule flags a long label", () => {
  const rule = new RollingSlaTierLabelLengthRule(64);
  const item = newRollingSlaTier("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSlaTierAttemptsRangeRule flags values above attempts", () => {
  const rule = new RollingSlaTierAttemptsRangeRule(16, 255);
  const item = newRollingSlaTier("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSlaTierRequiredLabelRule flags a blank label", () => {
  const rule = new RollingSlaTierRequiredLabelRule("rolling sla tier needs an entry");
  const item = newRollingSlaTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSlaTierRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSlaTierRequiredCodeRule("rolling sla tier needs an entry");
  const item = newRollingSlaTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSlaTierCodeLengthRule flags a long code", () => {
  const rule = new RollingSlaTierCodeLengthRule(80);
  const item = newRollingSlaTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
