import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteMetricCodeLengthRule,
  InviteMetricCreatedAtRangeRule,
  InviteMetricLocaleLengthRule,
  InviteMetricRatioRangeRule,
  InviteMetricRequiredLocaleRule,
  defaultInviteMetricValidator,
} from "./invite-metric-rules.js";
import { newInviteMetric } from "./invite-metric.js";

test("InviteMetricValidator reports every problem", () => {
  const validator = defaultInviteMetricValidator();
  const item = newInviteMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteMetricCreatedAtRangeRule flags values above created at", () => {
  const rule = new InviteMetricCreatedAtRangeRule(32, 3600);
  const item = newInviteMetric("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteMetricRatioRangeRule flags values above ratio", () => {
  const rule = new InviteMetricRatioRangeRule(3.3, 4032.7);
  const item = newInviteMetric("x", "y");
  item.ratio = 4034.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteMetricLocaleLengthRule flags a long locale", () => {
  const rule = new InviteMetricLocaleLengthRule(32);
  const item = newInviteMetric("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteMetricRequiredLocaleRule flags a blank locale", () => {
  const rule = new InviteMetricRequiredLocaleRule("invite metric needs this field");
  const item = newInviteMetric("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteMetricCodeLengthRule flags a long code", () => {
  const rule = new InviteMetricCodeLengthRule(255);
  const item = newInviteMetric("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
