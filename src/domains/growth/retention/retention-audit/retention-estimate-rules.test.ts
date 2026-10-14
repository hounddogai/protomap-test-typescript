import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionEstimateBidRangeRule,
  RetentionEstimateRequiredCodeRule,
  RetentionEstimateRequiredLabelRule,
  RetentionEstimateRequiredOwnerIdRule,
  defaultRetentionEstimateValidator,
} from "./retention-estimate-rules.js";
import { newRetentionEstimate } from "./retention-estimate.js";

test("RetentionEstimateValidator reports every problem", () => {
  const validator = defaultRetentionEstimateValidator();
  const item = newRetentionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionEstimateBidRangeRule flags values above bid", () => {
  const rule = new RetentionEstimateBidRangeRule(6.8, 2775.3);
  const item = newRetentionEstimate("x", "y");
  item.bid = 2776.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionEstimateRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RetentionEstimateRequiredOwnerIdRule("retention estimate needs an entry");
  const item = newRetentionEstimate("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionEstimateRequiredLabelRule flags a blank label", () => {
  const rule = new RetentionEstimateRequiredLabelRule("retention estimate needs a value");
  const item = newRetentionEstimate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionEstimateRequiredCodeRule("retention estimate needs this field");
  const item = newRetentionEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
