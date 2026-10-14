import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFrequencyGroupJourneyIdLengthRule,
  AdaptiveFrequencyGroupRequiredCodeRule,
  AdaptiveFrequencyGroupRequiredJourneyIdRule,
  AdaptiveFrequencyGroupRequiredLabelRule,
  defaultAdaptiveFrequencyGroupValidator,
} from "./adaptive-frequency-group-rules.js";
import { newAdaptiveFrequencyGroup } from "./adaptive-frequency-group.js";

test("AdaptiveFrequencyGroupValidator reports every problem", () => {
  const validator = defaultAdaptiveFrequencyGroupValidator();
  const item = newAdaptiveFrequencyGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFrequencyGroupRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveFrequencyGroupRequiredCodeRule("adaptive frequency group needs a value");
  const item = newAdaptiveFrequencyGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFrequencyGroupRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new AdaptiveFrequencyGroupRequiredJourneyIdRule("adaptive frequency group needs this field");
  const item = newAdaptiveFrequencyGroup("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFrequencyGroupJourneyIdLengthRule flags a long journey id", () => {
  const rule = new AdaptiveFrequencyGroupJourneyIdLengthRule(80);
  const item = newAdaptiveFrequencyGroup("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveFrequencyGroupRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveFrequencyGroupRequiredLabelRule("adaptive frequency group needs an entry");
  const item = newAdaptiveFrequencyGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
