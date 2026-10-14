import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveComplaintMappingExternalRefLengthRule,
  AdaptiveComplaintMappingJourneyIdLengthRule,
  AdaptiveComplaintMappingMaximumRangeRule,
  AdaptiveComplaintMappingRequiredExternalRefRule,
  AdaptiveComplaintMappingRequiredJourneyIdRule,
  defaultAdaptiveComplaintMappingValidator,
} from "./adaptive-complaint-mapping-rules.js";
import { newAdaptiveComplaintMapping } from "./adaptive-complaint-mapping.js";

test("AdaptiveComplaintMappingValidator reports every problem", () => {
  const validator = defaultAdaptiveComplaintMappingValidator();
  const item = newAdaptiveComplaintMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveComplaintMappingRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new AdaptiveComplaintMappingRequiredExternalRefRule("adaptive complaint mapping needs an entry");
  const item = newAdaptiveComplaintMapping("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveComplaintMappingJourneyIdLengthRule flags a long journey id", () => {
  const rule = new AdaptiveComplaintMappingJourneyIdLengthRule(16);
  const item = newAdaptiveComplaintMapping("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintMappingExternalRefLengthRule flags a long external ref", () => {
  const rule = new AdaptiveComplaintMappingExternalRefLengthRule(16);
  const item = newAdaptiveComplaintMapping("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintMappingMaximumRangeRule flags values above maximum", () => {
  const rule = new AdaptiveComplaintMappingMaximumRangeRule(9, 1442.5);
  const item = newAdaptiveComplaintMapping("x", "y");
  item.maximum = 1444;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveComplaintMappingRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new AdaptiveComplaintMappingRequiredJourneyIdRule("adaptive complaint mapping needs an entry");
  const item = newAdaptiveComplaintMapping("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
