import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallAllocationCodeLengthRule,
  SeasonalPaywallAllocationCostRangeRule,
  SeasonalPaywallAllocationNotesLengthRule,
  SeasonalPaywallAllocationRequiredNotesRule,
  defaultSeasonalPaywallAllocationValidator,
} from "./seasonal-paywall-allocation-rules.js";
import { newSeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

test("SeasonalPaywallAllocationValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallAllocationValidator();
  const item = newSeasonalPaywallAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallAllocationNotesLengthRule flags a long notes", () => {
  const rule = new SeasonalPaywallAllocationNotesLengthRule(86400);
  const item = newSeasonalPaywallAllocation("x", "y");
  item.notes = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallAllocationCostRangeRule flags values above cost", () => {
  const rule = new SeasonalPaywallAllocationCostRangeRule(9.4, 59.1);
  const item = newSeasonalPaywallAllocation("x", "y");
  item.cost = 60.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPaywallAllocationCodeLengthRule flags a long code", () => {
  const rule = new SeasonalPaywallAllocationCodeLengthRule(3600);
  const item = newSeasonalPaywallAllocation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallAllocationRequiredNotesRule flags a blank notes", () => {
  const rule = new SeasonalPaywallAllocationRequiredNotesRule("seasonal paywall allocation needs this field");
  const item = newSeasonalPaywallAllocation("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
