import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingTouchpointEstimateCodeLengthRule,
  PendingTouchpointEstimateCohortLengthRule,
  PendingTouchpointEstimateExpiresAtRangeRule,
  PendingTouchpointEstimateNameLengthRule,
  PendingTouchpointEstimateUpdatedAtRangeRule,
  defaultPendingTouchpointEstimateValidator,
} from "./pending-touchpoint-estimate-rules.js";
import { newPendingTouchpointEstimate } from "./pending-touchpoint-estimate.js";

test("PendingTouchpointEstimateValidator reports every problem", () => {
  const validator = defaultPendingTouchpointEstimateValidator();
  const item = newPendingTouchpointEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingTouchpointEstimateUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PendingTouchpointEstimateUpdatedAtRangeRule(32, 80);
  const item = newPendingTouchpointEstimate("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingTouchpointEstimateCodeLengthRule flags a long code", () => {
  const rule = new PendingTouchpointEstimateCodeLengthRule(64);
  const item = newPendingTouchpointEstimate("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingTouchpointEstimateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PendingTouchpointEstimateExpiresAtRangeRule(16, 120);
  const item = newPendingTouchpointEstimate("x", "y");
  item.expiresAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingTouchpointEstimateCohortLengthRule flags a long cohort", () => {
  const rule = new PendingTouchpointEstimateCohortLengthRule(1000);
  const item = newPendingTouchpointEstimate("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingTouchpointEstimateNameLengthRule flags a long name", () => {
  const rule = new PendingTouchpointEstimateNameLengthRule(16);
  const item = newPendingTouchpointEstimate("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
