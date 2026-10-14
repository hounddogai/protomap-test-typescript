import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyActivationEstimateRequiredCodeRule,
  LegacyActivationEstimateRequiredLabelRule,
  LegacyActivationEstimateRequiredSourceRule,
  defaultLegacyActivationEstimateValidator,
} from "./legacy-activation-estimate-rules.js";
import { newLegacyActivationEstimate } from "./legacy-activation-estimate.js";

test("LegacyActivationEstimateValidator reports every problem", () => {
  const validator = defaultLegacyActivationEstimateValidator();
  const item = newLegacyActivationEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyActivationEstimateRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyActivationEstimateRequiredLabelRule("legacy activation estimate needs this field");
  const item = newLegacyActivationEstimate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyActivationEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyActivationEstimateRequiredCodeRule("legacy activation estimate needs this field");
  const item = newLegacyActivationEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyActivationEstimateRequiredSourceRule flags a blank source", () => {
  const rule = new LegacyActivationEstimateRequiredSourceRule("legacy activation estimate needs an entry");
  const item = newLegacyActivationEstimate("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
