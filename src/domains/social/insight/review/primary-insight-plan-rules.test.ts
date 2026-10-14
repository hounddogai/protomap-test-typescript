import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryInsightPlanChannelLengthRule,
  PrimaryInsightPlanCountryLengthRule,
  PrimaryInsightPlanRequiredTitleRule,
  PrimaryInsightPlanTitleLengthRule,
  PrimaryInsightPlanWindowDaysRangeRule,
  defaultPrimaryInsightPlanValidator,
} from "./primary-insight-plan-rules.js";
import { newPrimaryInsightPlan } from "./primary-insight-plan.js";

test("PrimaryInsightPlanValidator reports every problem", () => {
  const validator = defaultPrimaryInsightPlanValidator();
  const item = newPrimaryInsightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryInsightPlanTitleLengthRule flags a long title", () => {
  const rule = new PrimaryInsightPlanTitleLengthRule(120);
  const item = newPrimaryInsightPlan("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInsightPlanWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryInsightPlanWindowDaysRangeRule(80, 120);
  const item = newPrimaryInsightPlan("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryInsightPlanCountryLengthRule flags a long country", () => {
  const rule = new PrimaryInsightPlanCountryLengthRule(32);
  const item = newPrimaryInsightPlan("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInsightPlanRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryInsightPlanRequiredTitleRule("primary insight plan needs an entry");
  const item = newPrimaryInsightPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryInsightPlanChannelLengthRule flags a long channel", () => {
  const rule = new PrimaryInsightPlanChannelLengthRule(1000);
  const item = newPrimaryInsightPlan("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
