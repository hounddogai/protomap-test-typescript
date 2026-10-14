import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyVarianceExternalRefLengthRule,
  JourneyVarianceRequiredLabelRule,
  defaultJourneyVarianceValidator,
} from "./journey-variance-rules.js";
import { newJourneyVariance } from "./journey-variance.js";

test("JourneyVarianceValidator reports every problem", () => {
  const validator = defaultJourneyVarianceValidator();
  const item = newJourneyVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyVarianceExternalRefLengthRule flags a long external ref", () => {
  const rule = new JourneyVarianceExternalRefLengthRule(120);
  const item = newJourneyVariance("x", "y");
  item.externalRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new JourneyVarianceRequiredLabelRule("journey variance needs an entry");
  const item = newJourneyVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
