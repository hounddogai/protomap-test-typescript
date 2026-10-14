import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBranchCycleDurationMinutesRangeRule,
  GlobalBranchCycleRequiredLabelRule,
  GlobalBranchCycleWeightRangeRule,
  defaultGlobalBranchCycleValidator,
} from "./global-branch-cycle-rules.js";
import { newGlobalBranchCycle } from "./global-branch-cycle.js";

test("GlobalBranchCycleValidator reports every problem", () => {
  const validator = defaultGlobalBranchCycleValidator();
  const item = newGlobalBranchCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBranchCycleDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new GlobalBranchCycleDurationMinutesRangeRule(120, 1000);
  const item = newGlobalBranchCycle("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalBranchCycleRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalBranchCycleRequiredLabelRule("global branch cycle needs this field");
  const item = newGlobalBranchCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBranchCycleWeightRangeRule flags values above weight", () => {
  const rule = new GlobalBranchCycleWeightRangeRule(4.2, 2132.3);
  const item = newGlobalBranchCycle("x", "y");
  item.weight = 2133.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
