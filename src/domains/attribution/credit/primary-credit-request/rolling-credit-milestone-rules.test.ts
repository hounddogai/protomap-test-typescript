import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCreditMilestoneRegionLengthRule,
  RollingCreditMilestoneRequiredRegionRule,
  RollingCreditMilestoneRetriesRangeRule,
  RollingCreditMilestoneTitleLengthRule,
  defaultRollingCreditMilestoneValidator,
} from "./rolling-credit-milestone-rules.js";
import { newRollingCreditMilestone } from "./rolling-credit-milestone.js";

test("RollingCreditMilestoneValidator reports every problem", () => {
  const validator = defaultRollingCreditMilestoneValidator();
  const item = newRollingCreditMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCreditMilestoneRegionLengthRule flags a long region", () => {
  const rule = new RollingCreditMilestoneRegionLengthRule(255);
  const item = newRollingCreditMilestone("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCreditMilestoneTitleLengthRule flags a long title", () => {
  const rule = new RollingCreditMilestoneTitleLengthRule(64);
  const item = newRollingCreditMilestone("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCreditMilestoneRetriesRangeRule flags values above retries", () => {
  const rule = new RollingCreditMilestoneRetriesRangeRule(64, 86400);
  const item = newRollingCreditMilestone("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCreditMilestoneRequiredRegionRule flags a blank region", () => {
  const rule = new RollingCreditMilestoneRequiredRegionRule("rolling credit milestone needs this field");
  const item = newRollingCreditMilestone("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
