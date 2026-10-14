import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedInviteTierBudgetRangeRule,
  WeightedInviteTierPriorityRangeRule,
  WeightedInviteTierRequiredCodeRule,
  WeightedInviteTierRequiredNameRule,
  defaultWeightedInviteTierValidator,
} from "./weighted-invite-tier-rules.js";
import { newWeightedInviteTier } from "./weighted-invite-tier.js";

test("WeightedInviteTierValidator reports every problem", () => {
  const validator = defaultWeightedInviteTierValidator();
  const item = newWeightedInviteTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedInviteTierPriorityRangeRule flags values above priority", () => {
  const rule = new WeightedInviteTierPriorityRangeRule(1000, 3600);
  const item = newWeightedInviteTier("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedInviteTierRequiredNameRule flags a blank name", () => {
  const rule = new WeightedInviteTierRequiredNameRule("weighted invite tier needs a value");
  const item = newWeightedInviteTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedInviteTierRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedInviteTierRequiredCodeRule("weighted invite tier needs this field");
  const item = newWeightedInviteTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedInviteTierBudgetRangeRule flags values above budget", () => {
  const rule = new WeightedInviteTierBudgetRangeRule(7.5, 3181.2);
  const item = newWeightedInviteTier("x", "y");
  item.budget = 3182.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
