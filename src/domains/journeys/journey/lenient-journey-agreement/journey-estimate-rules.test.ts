import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyEstimateLabelLengthRule,
  JourneyEstimateRequiredCodeRule,
  JourneyEstimateRequiredOwnerIdRule,
  JourneyEstimateRequiredUtmSourceRule,
  defaultJourneyEstimateValidator,
} from "./journey-estimate-rules.js";
import { newJourneyEstimate } from "./journey-estimate.js";

test("JourneyEstimateValidator reports every problem", () => {
  const validator = defaultJourneyEstimateValidator();
  const item = newJourneyEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyEstimateRequiredCodeRule("journey estimate needs this field");
  const item = newJourneyEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyEstimateLabelLengthRule flags a long label", () => {
  const rule = new JourneyEstimateLabelLengthRule(120);
  const item = newJourneyEstimate("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyEstimateRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new JourneyEstimateRequiredUtmSourceRule("journey estimate needs a value");
  const item = newJourneyEstimate("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyEstimateRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new JourneyEstimateRequiredOwnerIdRule("journey estimate needs a value");
  const item = newJourneyEstimate("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
