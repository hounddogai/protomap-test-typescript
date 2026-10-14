import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySubscriptionMilestoneCodeLengthRule,
  LegacySubscriptionMilestoneCostRangeRule,
  LegacySubscriptionMilestoneRequiredCodeRule,
  LegacySubscriptionMilestoneRequiredTitleRule,
  LegacySubscriptionMilestoneTitleLengthRule,
  defaultLegacySubscriptionMilestoneValidator,
} from "./legacy-subscription-milestone-rules.js";
import { newLegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

test("LegacySubscriptionMilestoneValidator reports every problem", () => {
  const validator = defaultLegacySubscriptionMilestoneValidator();
  const item = newLegacySubscriptionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySubscriptionMilestoneTitleLengthRule flags a long title", () => {
  const rule = new LegacySubscriptionMilestoneTitleLengthRule(3600);
  const item = newLegacySubscriptionMilestone("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySubscriptionMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LegacySubscriptionMilestoneCodeLengthRule(32);
  const item = newLegacySubscriptionMilestone("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySubscriptionMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new LegacySubscriptionMilestoneRequiredCodeRule("legacy subscription milestone needs a value");
  const item = newLegacySubscriptionMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySubscriptionMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new LegacySubscriptionMilestoneRequiredTitleRule("legacy subscription milestone needs a value");
  const item = newLegacySubscriptionMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySubscriptionMilestoneCostRangeRule flags values above cost", () => {
  const rule = new LegacySubscriptionMilestoneCostRangeRule(4, 3247.5);
  const item = newLegacySubscriptionMilestone("x", "y");
  item.cost = 3249;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
