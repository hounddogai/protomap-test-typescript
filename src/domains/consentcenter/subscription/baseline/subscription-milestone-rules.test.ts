import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionMilestoneCountryLengthRule,
  SubscriptionMilestoneQuantityRangeRule,
  SubscriptionMilestoneRequiredCodeRule,
  SubscriptionMilestoneRequiredCountryRule,
  defaultSubscriptionMilestoneValidator,
} from "./subscription-milestone-rules.js";
import { newSubscriptionMilestone } from "./subscription-milestone.js";

test("SubscriptionMilestoneValidator reports every problem", () => {
  const validator = defaultSubscriptionMilestoneValidator();
  const item = newSubscriptionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionMilestoneRequiredCountryRule flags a blank country", () => {
  const rule = new SubscriptionMilestoneRequiredCountryRule("subscription milestone needs an entry");
  const item = newSubscriptionMilestone("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionMilestoneRequiredCodeRule("subscription milestone needs an entry");
  const item = newSubscriptionMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionMilestoneCountryLengthRule flags a long country", () => {
  const rule = new SubscriptionMilestoneCountryLengthRule(120);
  const item = newSubscriptionMilestone("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionMilestoneQuantityRangeRule flags values above quantity", () => {
  const rule = new SubscriptionMilestoneQuantityRangeRule(32, 64);
  const item = newSubscriptionMilestone("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
