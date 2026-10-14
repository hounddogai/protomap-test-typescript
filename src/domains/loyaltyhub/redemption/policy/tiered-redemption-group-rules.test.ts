import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRedemptionGroupCodeLengthRule,
  TieredRedemptionGroupCostRangeRule,
  TieredRedemptionGroupMinimumRangeRule,
  TieredRedemptionGroupRequiredJourneyIdRule,
  TieredRedemptionGroupRequiredTitleRule,
  TieredRedemptionGroupReviewerLengthRule,
  defaultTieredRedemptionGroupValidator,
} from "./tiered-redemption-group-rules.js";
import { newTieredRedemptionGroup } from "./tiered-redemption-group.js";

test("TieredRedemptionGroupValidator reports every problem", () => {
  const validator = defaultTieredRedemptionGroupValidator();
  const item = newTieredRedemptionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRedemptionGroupMinimumRangeRule flags values above minimum", () => {
  const rule = new TieredRedemptionGroupMinimumRangeRule(8.9, 3135.3);
  const item = newTieredRedemptionGroup("x", "y");
  item.minimum = 3136.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRedemptionGroupCodeLengthRule flags a long code", () => {
  const rule = new TieredRedemptionGroupCodeLengthRule(80);
  const item = newTieredRedemptionGroup("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRedemptionGroupCostRangeRule flags values above cost", () => {
  const rule = new TieredRedemptionGroupCostRangeRule(6.9, 1943.4);
  const item = newTieredRedemptionGroup("x", "y");
  item.cost = 1944.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRedemptionGroupReviewerLengthRule flags a long reviewer", () => {
  const rule = new TieredRedemptionGroupReviewerLengthRule(86400);
  const item = newTieredRedemptionGroup("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRedemptionGroupRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TieredRedemptionGroupRequiredJourneyIdRule("tiered redemption group needs an entry");
  const item = newTieredRedemptionGroup("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRedemptionGroupRequiredTitleRule flags a blank title", () => {
  const rule = new TieredRedemptionGroupRequiredTitleRule("tiered redemption group needs a value");
  const item = newTieredRedemptionGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
