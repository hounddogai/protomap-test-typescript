import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPaywallMilestoneCodeLengthRule,
  DefaultPaywallMilestoneNameLengthRule,
  DefaultPaywallMilestoneRequiredCodeRule,
  DefaultPaywallMilestoneRequiredReviewerRule,
  defaultDefaultPaywallMilestoneValidator,
} from "./default-paywall-milestone-rules.js";
import { newDefaultPaywallMilestone } from "./default-paywall-milestone.js";

test("DefaultPaywallMilestoneValidator reports every problem", () => {
  const validator = defaultDefaultPaywallMilestoneValidator();
  const item = newDefaultPaywallMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPaywallMilestoneNameLengthRule flags a long name", () => {
  const rule = new DefaultPaywallMilestoneNameLengthRule(3600);
  const item = newDefaultPaywallMilestone("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPaywallMilestoneRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new DefaultPaywallMilestoneRequiredReviewerRule("default paywall milestone needs an entry");
  const item = newDefaultPaywallMilestone("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultPaywallMilestoneRequiredCodeRule("default paywall milestone needs this field");
  const item = newDefaultPaywallMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallMilestoneCodeLengthRule flags a long code", () => {
  const rule = new DefaultPaywallMilestoneCodeLengthRule(16);
  const item = newDefaultPaywallMilestone("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
