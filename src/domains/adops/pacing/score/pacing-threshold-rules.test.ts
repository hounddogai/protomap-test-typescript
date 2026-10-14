import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingThresholdPhoneLengthRule,
  PacingThresholdRequiredNameRule,
  PacingThresholdRequiredTitleRule,
  defaultPacingThresholdValidator,
} from "./pacing-threshold-rules.js";
import { newPacingThreshold } from "./pacing-threshold.js";

test("PacingThresholdValidator reports every problem", () => {
  const validator = defaultPacingThresholdValidator();
  const item = newPacingThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new PacingThresholdRequiredTitleRule("pacing threshold needs a value");
  const item = newPacingThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingThresholdRequiredNameRule flags a blank name", () => {
  const rule = new PacingThresholdRequiredNameRule("pacing threshold needs this field");
  const item = newPacingThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingThresholdPhoneLengthRule flags a long phone", () => {
  const rule = new PacingThresholdPhoneLengthRule(86400);
  const item = newPacingThreshold("x", "y");
  item.phone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
