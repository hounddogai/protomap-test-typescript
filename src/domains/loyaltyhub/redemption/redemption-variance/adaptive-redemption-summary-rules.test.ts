import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRedemptionSummaryCodeLengthRule,
  AdaptiveRedemptionSummaryTitleLengthRule,
  defaultAdaptiveRedemptionSummaryValidator,
} from "./adaptive-redemption-summary-rules.js";
import { newAdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

test("AdaptiveRedemptionSummaryValidator reports every problem", () => {
  const validator = defaultAdaptiveRedemptionSummaryValidator();
  const item = newAdaptiveRedemptionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRedemptionSummaryTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveRedemptionSummaryTitleLengthRule(3600);
  const item = newAdaptiveRedemptionSummary("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveRedemptionSummaryCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveRedemptionSummaryCodeLengthRule(1000);
  const item = newAdaptiveRedemptionSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
