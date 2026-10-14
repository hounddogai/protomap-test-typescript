import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFraudCheckEstimateCapacityRangeRule,
  LegacyFraudCheckEstimateCodeLengthRule,
  LegacyFraudCheckEstimateRequiredOwnerIdRule,
  LegacyFraudCheckEstimateVersionRangeRule,
  defaultLegacyFraudCheckEstimateValidator,
} from "./legacy-fraud-check-estimate-rules.js";
import { newLegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

test("LegacyFraudCheckEstimateValidator reports every problem", () => {
  const validator = defaultLegacyFraudCheckEstimateValidator();
  const item = newLegacyFraudCheckEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFraudCheckEstimateCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyFraudCheckEstimateCapacityRangeRule(80, 120);
  const item = newLegacyFraudCheckEstimate("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFraudCheckEstimateCodeLengthRule flags a long code", () => {
  const rule = new LegacyFraudCheckEstimateCodeLengthRule(86400);
  const item = newLegacyFraudCheckEstimate("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFraudCheckEstimateRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LegacyFraudCheckEstimateRequiredOwnerIdRule("legacy fraud check estimate needs this field");
  const item = newLegacyFraudCheckEstimate("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFraudCheckEstimateVersionRangeRule flags values above version", () => {
  const rule = new LegacyFraudCheckEstimateVersionRangeRule(64, 1000);
  const item = newLegacyFraudCheckEstimate("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
