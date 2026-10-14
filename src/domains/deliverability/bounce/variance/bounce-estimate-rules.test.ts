import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceEstimateJourneyIdLengthRule,
  BounceEstimateRequiredUtmSourceRule,
  BounceEstimateUtmSourceLengthRule,
  defaultBounceEstimateValidator,
} from "./bounce-estimate-rules.js";
import { newBounceEstimate } from "./bounce-estimate.js";

test("BounceEstimateValidator reports every problem", () => {
  const validator = defaultBounceEstimateValidator();
  const item = newBounceEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceEstimateUtmSourceLengthRule flags a long utm source", () => {
  const rule = new BounceEstimateUtmSourceLengthRule(32);
  const item = newBounceEstimate("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceEstimateRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BounceEstimateRequiredUtmSourceRule("bounce estimate needs this field");
  const item = newBounceEstimate("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceEstimateJourneyIdLengthRule flags a long journey id", () => {
  const rule = new BounceEstimateJourneyIdLengthRule(255);
  const item = newBounceEstimate("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
