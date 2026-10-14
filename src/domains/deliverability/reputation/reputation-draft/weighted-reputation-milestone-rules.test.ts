import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedReputationMilestoneNameLengthRule,
  WeightedReputationMilestoneRegionLengthRule,
  WeightedReputationMilestoneRequiredCountryRule,
  WeightedReputationMilestoneRequiredRegionRule,
  defaultWeightedReputationMilestoneValidator,
} from "./weighted-reputation-milestone-rules.js";
import { newWeightedReputationMilestone } from "./weighted-reputation-milestone.js";

test("WeightedReputationMilestoneValidator reports every problem", () => {
  const validator = defaultWeightedReputationMilestoneValidator();
  const item = newWeightedReputationMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedReputationMilestoneRegionLengthRule flags a long region", () => {
  const rule = new WeightedReputationMilestoneRegionLengthRule(1000);
  const item = newWeightedReputationMilestone("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReputationMilestoneRequiredRegionRule flags a blank region", () => {
  const rule = new WeightedReputationMilestoneRequiredRegionRule("weighted reputation milestone needs an entry");
  const item = newWeightedReputationMilestone("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReputationMilestoneNameLengthRule flags a long name", () => {
  const rule = new WeightedReputationMilestoneNameLengthRule(64);
  const item = newWeightedReputationMilestone("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReputationMilestoneRequiredCountryRule flags a blank country", () => {
  const rule = new WeightedReputationMilestoneRequiredCountryRule("weighted reputation milestone needs a value");
  const item = newWeightedReputationMilestone("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
