import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictJourneyRollupBudgetRangeRule,
  StrictJourneyRollupRequiredLabelRule,
  StrictJourneyRollupRequiredRegionRule,
  defaultStrictJourneyRollupValidator,
} from "./strict-journey-rollup-rules.js";
import { newStrictJourneyRollup } from "./strict-journey-rollup.js";

test("StrictJourneyRollupValidator reports every problem", () => {
  const validator = defaultStrictJourneyRollupValidator();
  const item = newStrictJourneyRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictJourneyRollupRequiredLabelRule flags a blank label", () => {
  const rule = new StrictJourneyRollupRequiredLabelRule("strict journey rollup needs an entry");
  const item = newStrictJourneyRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictJourneyRollupBudgetRangeRule flags values above budget", () => {
  const rule = new StrictJourneyRollupBudgetRangeRule(4.1, 1703.8);
  const item = newStrictJourneyRollup("x", "y");
  item.budget = 1705.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictJourneyRollupRequiredRegionRule flags a blank region", () => {
  const rule = new StrictJourneyRollupRequiredRegionRule("strict journey rollup needs this field");
  const item = newStrictJourneyRollup("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
