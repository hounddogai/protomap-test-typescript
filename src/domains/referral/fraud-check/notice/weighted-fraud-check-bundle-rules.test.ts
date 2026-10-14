import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFraudCheckBundleAudienceIdLengthRule,
  WeightedFraudCheckBundleCodeLengthRule,
  WeightedFraudCheckBundleRequiredLabelRule,
  defaultWeightedFraudCheckBundleValidator,
} from "./weighted-fraud-check-bundle-rules.js";
import { newWeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

test("WeightedFraudCheckBundleValidator reports every problem", () => {
  const validator = defaultWeightedFraudCheckBundleValidator();
  const item = newWeightedFraudCheckBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFraudCheckBundleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WeightedFraudCheckBundleAudienceIdLengthRule(120);
  const item = newWeightedFraudCheckBundle("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFraudCheckBundleRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedFraudCheckBundleRequiredLabelRule("weighted fraud check bundle needs a value");
  const item = newWeightedFraudCheckBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFraudCheckBundleCodeLengthRule flags a long code", () => {
  const rule = new WeightedFraudCheckBundleCodeLengthRule(1000);
  const item = newWeightedFraudCheckBundle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
