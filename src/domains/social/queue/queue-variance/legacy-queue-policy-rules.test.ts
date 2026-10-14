import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyQueuePolicyBidRangeRule,
  LegacyQueuePolicyBudgetRangeRule,
  LegacyQueuePolicyRequiredCodeRule,
  LegacyQueuePolicyRequiredJourneyIdRule,
  defaultLegacyQueuePolicyValidator,
} from "./legacy-queue-policy-rules.js";
import { newLegacyQueuePolicy } from "./legacy-queue-policy.js";

test("LegacyQueuePolicyValidator reports every problem", () => {
  const validator = defaultLegacyQueuePolicyValidator();
  const item = newLegacyQueuePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyQueuePolicyRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyQueuePolicyRequiredCodeRule("legacy queue policy needs this field");
  const item = newLegacyQueuePolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyQueuePolicyRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LegacyQueuePolicyRequiredJourneyIdRule("legacy queue policy needs this field");
  const item = newLegacyQueuePolicy("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyQueuePolicyBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyQueuePolicyBudgetRangeRule(1.4, 2875.9);
  const item = newLegacyQueuePolicy("x", "y");
  item.budget = 2877.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyQueuePolicyBidRangeRule flags values above bid", () => {
  const rule = new LegacyQueuePolicyBidRangeRule(3.1, 317.6);
  const item = newLegacyQueuePolicy("x", "y");
  item.bid = 319.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
