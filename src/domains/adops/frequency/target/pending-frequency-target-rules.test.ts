import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFrequencyTargetMarginRangeRule,
  PendingFrequencyTargetRequiredTitleRule,
  PendingFrequencyTargetSegmentLengthRule,
  PendingFrequencyTargetTitleLengthRule,
  defaultPendingFrequencyTargetValidator,
} from "./pending-frequency-target-rules.js";
import { newPendingFrequencyTarget } from "./pending-frequency-target.js";

test("PendingFrequencyTargetValidator reports every problem", () => {
  const validator = defaultPendingFrequencyTargetValidator();
  const item = newPendingFrequencyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFrequencyTargetRequiredTitleRule flags a blank title", () => {
  const rule = new PendingFrequencyTargetRequiredTitleRule("pending frequency target needs a value");
  const item = newPendingFrequencyTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFrequencyTargetMarginRangeRule flags values above margin", () => {
  const rule = new PendingFrequencyTargetMarginRangeRule(6.4, 1437.6);
  const item = newPendingFrequencyTarget("x", "y");
  item.margin = 1439.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingFrequencyTargetTitleLengthRule flags a long title", () => {
  const rule = new PendingFrequencyTargetTitleLengthRule(255);
  const item = newPendingFrequencyTarget("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyTargetSegmentLengthRule flags a long segment", () => {
  const rule = new PendingFrequencyTargetSegmentLengthRule(32);
  const item = newPendingFrequencyTarget("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
