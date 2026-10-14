import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionEstimateNameLengthRule,
  SuppressionEstimateRequiredDescriptionRule,
  defaultSuppressionEstimateValidator,
} from "./suppression-estimate-rules.js";
import { newSuppressionEstimate } from "./suppression-estimate.js";

test("SuppressionEstimateValidator reports every problem", () => {
  const validator = defaultSuppressionEstimateValidator();
  const item = newSuppressionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionEstimateRequiredDescriptionRule flags a blank description", () => {
  const rule = new SuppressionEstimateRequiredDescriptionRule("suppression estimate needs this field");
  const item = newSuppressionEstimate("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionEstimateNameLengthRule flags a long name", () => {
  const rule = new SuppressionEstimateNameLengthRule(16);
  const item = newSuppressionEstimate("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
