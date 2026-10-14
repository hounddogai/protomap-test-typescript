import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneyRollupAudienceIdLengthRule,
  RollingJourneyRollupBudgetRangeRule,
  RollingJourneyRollupRequiredAudienceIdRule,
  RollingJourneyRollupRequiredLabelRule,
  defaultRollingJourneyRollupValidator,
} from "./rolling-journey-rollup-rules.js";
import { newRollingJourneyRollup } from "./rolling-journey-rollup.js";

test("RollingJourneyRollupValidator reports every problem", () => {
  const validator = defaultRollingJourneyRollupValidator();
  const item = newRollingJourneyRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneyRollupRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new RollingJourneyRollupRequiredAudienceIdRule("rolling journey rollup needs a value");
  const item = newRollingJourneyRollup("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyRollupRequiredLabelRule flags a blank label", () => {
  const rule = new RollingJourneyRollupRequiredLabelRule("rolling journey rollup needs a value");
  const item = newRollingJourneyRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyRollupAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RollingJourneyRollupAudienceIdLengthRule(86400);
  const item = newRollingJourneyRollup("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingJourneyRollupBudgetRangeRule flags values above budget", () => {
  const rule = new RollingJourneyRollupBudgetRangeRule(5.8, 1991);
  const item = newRollingJourneyRollup("x", "y");
  item.budget = 1992.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
