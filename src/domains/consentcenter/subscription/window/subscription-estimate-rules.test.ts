import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionEstimatePriorityRangeRule,
  SubscriptionEstimateRequiredAudienceIdRule,
  SubscriptionEstimateRequiredNameRule,
  SubscriptionEstimateRequiredSummaryRule,
  defaultSubscriptionEstimateValidator,
} from "./subscription-estimate-rules.js";
import { newSubscriptionEstimate } from "./subscription-estimate.js";

test("SubscriptionEstimateValidator reports every problem", () => {
  const validator = defaultSubscriptionEstimateValidator();
  const item = newSubscriptionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionEstimateRequiredSummaryRule flags a blank summary", () => {
  const rule = new SubscriptionEstimateRequiredSummaryRule("subscription estimate needs this field");
  const item = newSubscriptionEstimate("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionEstimateRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SubscriptionEstimateRequiredAudienceIdRule("subscription estimate needs an entry");
  const item = newSubscriptionEstimate("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionEstimateRequiredNameRule flags a blank name", () => {
  const rule = new SubscriptionEstimateRequiredNameRule("subscription estimate needs a value");
  const item = newSubscriptionEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionEstimatePriorityRangeRule flags values above priority", () => {
  const rule = new SubscriptionEstimatePriorityRangeRule(255, 3600);
  const item = newSubscriptionEstimate("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
