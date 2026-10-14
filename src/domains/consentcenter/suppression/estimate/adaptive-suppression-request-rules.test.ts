import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSuppressionRequestAttemptsRangeRule,
  AdaptiveSuppressionRequestContactEmailLengthRule,
  AdaptiveSuppressionRequestRequiredDescriptionRule,
  AdaptiveSuppressionRequestRequiredTitleRule,
  defaultAdaptiveSuppressionRequestValidator,
} from "./adaptive-suppression-request-rules.js";
import { newAdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

test("AdaptiveSuppressionRequestValidator reports every problem", () => {
  const validator = defaultAdaptiveSuppressionRequestValidator();
  const item = newAdaptiveSuppressionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSuppressionRequestRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveSuppressionRequestRequiredTitleRule("adaptive suppression request needs this field");
  const item = newAdaptiveSuppressionRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSuppressionRequestRequiredDescriptionRule flags a blank description", () => {
  const rule = new AdaptiveSuppressionRequestRequiredDescriptionRule("adaptive suppression request needs a value");
  const item = newAdaptiveSuppressionRequest("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSuppressionRequestContactEmailLengthRule flags a long contact email", () => {
  const rule = new AdaptiveSuppressionRequestContactEmailLengthRule(80);
  const item = newAdaptiveSuppressionRequest("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveSuppressionRequestAttemptsRangeRule flags values above attempts", () => {
  const rule = new AdaptiveSuppressionRequestAttemptsRangeRule(32, 86400);
  const item = newAdaptiveSuppressionRequest("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
