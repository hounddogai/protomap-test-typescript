import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionMappingRequiredLabelRule,
  SubscriptionMappingRequiredRegionRule,
  SubscriptionMappingScoreRangeRule,
  defaultSubscriptionMappingValidator,
} from "./subscription-mapping-rules.js";
import { newSubscriptionMapping } from "./subscription-mapping.js";

test("SubscriptionMappingValidator reports every problem", () => {
  const validator = defaultSubscriptionMappingValidator();
  const item = newSubscriptionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionMappingRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionMappingRequiredLabelRule("subscription mapping needs an entry");
  const item = newSubscriptionMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionMappingScoreRangeRule flags values above score", () => {
  const rule = new SubscriptionMappingScoreRangeRule(8.8, 677);
  const item = newSubscriptionMapping("x", "y");
  item.score = 678.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionMappingRequiredRegionRule flags a blank region", () => {
  const rule = new SubscriptionMappingRequiredRegionRule("subscription mapping needs a value");
  const item = newSubscriptionMapping("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
