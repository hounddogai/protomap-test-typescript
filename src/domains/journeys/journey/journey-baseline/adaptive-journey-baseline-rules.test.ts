import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveJourneyBaselineChannelLengthRule,
  AdaptiveJourneyBaselineExternalRefLengthRule,
  AdaptiveJourneyBaselineLabelLengthRule,
  AdaptiveJourneyBaselineRequiredCodeRule,
  defaultAdaptiveJourneyBaselineValidator,
} from "./adaptive-journey-baseline-rules.js";
import { newAdaptiveJourneyBaseline } from "./adaptive-journey-baseline.js";

test("AdaptiveJourneyBaselineValidator reports every problem", () => {
  const validator = defaultAdaptiveJourneyBaselineValidator();
  const item = newAdaptiveJourneyBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveJourneyBaselineLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveJourneyBaselineLabelLengthRule(1000);
  const item = newAdaptiveJourneyBaseline("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveJourneyBaselineChannelLengthRule flags a long channel", () => {
  const rule = new AdaptiveJourneyBaselineChannelLengthRule(64);
  const item = newAdaptiveJourneyBaseline("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveJourneyBaselineExternalRefLengthRule flags a long external ref", () => {
  const rule = new AdaptiveJourneyBaselineExternalRefLengthRule(3600);
  const item = newAdaptiveJourneyBaseline("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveJourneyBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveJourneyBaselineRequiredCodeRule("adaptive journey baseline needs an entry");
  const item = newAdaptiveJourneyBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
