import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryNudgeOverrideGraceDaysRangeRule,
  PrimaryNudgeOverrideLabelLengthRule,
  PrimaryNudgeOverrideLocaleLengthRule,
  PrimaryNudgeOverrideRequiredLabelRule,
  defaultPrimaryNudgeOverrideValidator,
} from "./primary-nudge-override-rules.js";
import { newPrimaryNudgeOverride } from "./primary-nudge-override.js";

test("PrimaryNudgeOverrideValidator reports every problem", () => {
  const validator = defaultPrimaryNudgeOverrideValidator();
  const item = newPrimaryNudgeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryNudgeOverrideGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PrimaryNudgeOverrideGraceDaysRangeRule(32, 32);
  const item = newPrimaryNudgeOverride("x", "y");
  item.graceDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryNudgeOverrideLabelLengthRule flags a long label", () => {
  const rule = new PrimaryNudgeOverrideLabelLengthRule(80);
  const item = newPrimaryNudgeOverride("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryNudgeOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryNudgeOverrideRequiredLabelRule("primary nudge override needs a value");
  const item = newPrimaryNudgeOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryNudgeOverrideLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryNudgeOverrideLocaleLengthRule(16);
  const item = newPrimaryNudgeOverride("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
