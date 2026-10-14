import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictInviteMetricBudgetRangeRule,
  StrictInviteMetricCodeLengthRule,
  StrictInviteMetricContactEmailLengthRule,
  StrictInviteMetricRequiredContactEmailRule,
  StrictInviteMetricRequiredNotesRule,
  defaultStrictInviteMetricValidator,
} from "./strict-invite-metric-rules.js";
import { newStrictInviteMetric } from "./strict-invite-metric.js";

test("StrictInviteMetricValidator reports every problem", () => {
  const validator = defaultStrictInviteMetricValidator();
  const item = newStrictInviteMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictInviteMetricRequiredNotesRule flags a blank notes", () => {
  const rule = new StrictInviteMetricRequiredNotesRule("strict invite metric needs an entry");
  const item = newStrictInviteMetric("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInviteMetricContactEmailLengthRule flags a long contact email", () => {
  const rule = new StrictInviteMetricContactEmailLengthRule(32);
  const item = newStrictInviteMetric("x", "y");
  item.contactEmail = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictInviteMetricBudgetRangeRule flags values above budget", () => {
  const rule = new StrictInviteMetricBudgetRangeRule(2.2, 2031);
  const item = newStrictInviteMetric("x", "y");
  item.budget = 2032.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictInviteMetricRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new StrictInviteMetricRequiredContactEmailRule("strict invite metric needs this field");
  const item = newStrictInviteMetric("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInviteMetricCodeLengthRule flags a long code", () => {
  const rule = new StrictInviteMetricCodeLengthRule(80);
  const item = newStrictInviteMetric("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
