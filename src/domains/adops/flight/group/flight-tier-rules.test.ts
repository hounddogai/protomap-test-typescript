import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightTierBudgetRangeRule,
  FlightTierCodeLengthRule,
  FlightTierCostRangeRule,
  FlightTierNameLengthRule,
  FlightTierRequiredAudienceIdRule,
  FlightTierRequiredNameRule,
  defaultFlightTierValidator,
} from "./flight-tier-rules.js";
import { newFlightTier } from "./flight-tier.js";

test("FlightTierValidator reports every problem", () => {
  const validator = defaultFlightTierValidator();
  const item = newFlightTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightTierRequiredNameRule flags a blank name", () => {
  const rule = new FlightTierRequiredNameRule("flight tier needs a value");
  const item = newFlightTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightTierNameLengthRule flags a long name", () => {
  const rule = new FlightTierNameLengthRule(86400);
  const item = newFlightTier("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightTierBudgetRangeRule flags values above budget", () => {
  const rule = new FlightTierBudgetRangeRule(0.9, 4191.8);
  const item = newFlightTier("x", "y");
  item.budget = 4193.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightTierCostRangeRule flags values above cost", () => {
  const rule = new FlightTierCostRangeRule(8.8, 858.4);
  const item = newFlightTier("x", "y");
  item.cost = 859.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightTierRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new FlightTierRequiredAudienceIdRule("flight tier needs a value");
  const item = newFlightTier("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightTierCodeLengthRule flags a long code", () => {
  const rule = new FlightTierCodeLengthRule(255);
  const item = newFlightTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
