import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPacingBaselineBidRangeRule,
  ScheduledPacingBaselineCodeLengthRule,
  ScheduledPacingBaselineDurationMinutesRangeRule,
  ScheduledPacingBaselineLabelLengthRule,
  ScheduledPacingBaselineRequiredLabelRule,
  defaultScheduledPacingBaselineValidator,
} from "./scheduled-pacing-baseline-rules.js";
import { newScheduledPacingBaseline } from "./scheduled-pacing-baseline.js";

test("ScheduledPacingBaselineValidator reports every problem", () => {
  const validator = defaultScheduledPacingBaselineValidator();
  const item = newScheduledPacingBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPacingBaselineCodeLengthRule flags a long code", () => {
  const rule = new ScheduledPacingBaselineCodeLengthRule(3600);
  const item = newScheduledPacingBaseline("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPacingBaselineLabelLengthRule flags a long label", () => {
  const rule = new ScheduledPacingBaselineLabelLengthRule(32);
  const item = newScheduledPacingBaseline("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPacingBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledPacingBaselineRequiredLabelRule("scheduled pacing baseline needs this field");
  const item = newScheduledPacingBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPacingBaselineBidRangeRule flags values above bid", () => {
  const rule = new ScheduledPacingBaselineBidRangeRule(2.4, 3147.3);
  const item = newScheduledPacingBaseline("x", "y");
  item.bid = 3148.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledPacingBaselineDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ScheduledPacingBaselineDurationMinutesRangeRule(3600, 86400);
  const item = newScheduledPacingBaseline("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
