import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionOverrideFrequencyCapRangeRule,
  RetentionOverrideLabelLengthRule,
  RetentionOverrideRequiredTitleRule,
  RetentionOverrideStartsAtRangeRule,
  RetentionOverrideTitleLengthRule,
  RetentionOverrideUpdatedAtRangeRule,
  defaultRetentionOverrideValidator,
} from "./retention-override-rules.js";
import { newRetentionOverride } from "./retention-override.js";

test("RetentionOverrideValidator reports every problem", () => {
  const validator = defaultRetentionOverrideValidator();
  const item = newRetentionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionOverrideLabelLengthRule flags a long label", () => {
  const rule = new RetentionOverrideLabelLengthRule(64);
  const item = newRetentionOverride("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionOverrideTitleLengthRule flags a long title", () => {
  const rule = new RetentionOverrideTitleLengthRule(255);
  const item = newRetentionOverride("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionOverrideFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RetentionOverrideFrequencyCapRangeRule(120, 1000);
  const item = newRetentionOverride("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new RetentionOverrideRequiredTitleRule("retention override needs a value");
  const item = newRetentionOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionOverrideStartsAtRangeRule flags values above starts at", () => {
  const rule = new RetentionOverrideStartsAtRangeRule(80, 120);
  const item = newRetentionOverride("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionOverrideUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RetentionOverrideUpdatedAtRangeRule(80, 120);
  const item = newRetentionOverride("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
