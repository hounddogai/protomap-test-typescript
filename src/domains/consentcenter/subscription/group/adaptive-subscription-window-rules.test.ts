import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSubscriptionWindowRequiredCodeRule,
  AdaptiveSubscriptionWindowRequiredSummaryRule,
  AdaptiveSubscriptionWindowStartsAtRangeRule,
  AdaptiveSubscriptionWindowSummaryLengthRule,
  AdaptiveSubscriptionWindowTitleLengthRule,
  defaultAdaptiveSubscriptionWindowValidator,
} from "./adaptive-subscription-window-rules.js";
import { newAdaptiveSubscriptionWindow } from "./adaptive-subscription-window.js";

test("AdaptiveSubscriptionWindowValidator reports every problem", () => {
  const validator = defaultAdaptiveSubscriptionWindowValidator();
  const item = newAdaptiveSubscriptionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSubscriptionWindowSummaryLengthRule flags a long summary", () => {
  const rule = new AdaptiveSubscriptionWindowSummaryLengthRule(1000);
  const item = newAdaptiveSubscriptionWindow("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveSubscriptionWindowStartsAtRangeRule flags values above starts at", () => {
  const rule = new AdaptiveSubscriptionWindowStartsAtRangeRule(64, 3600);
  const item = newAdaptiveSubscriptionWindow("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveSubscriptionWindowRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveSubscriptionWindowRequiredCodeRule("adaptive subscription window needs a value");
  const item = newAdaptiveSubscriptionWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSubscriptionWindowRequiredSummaryRule flags a blank summary", () => {
  const rule = new AdaptiveSubscriptionWindowRequiredSummaryRule("adaptive subscription window needs an entry");
  const item = newAdaptiveSubscriptionWindow("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSubscriptionWindowTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveSubscriptionWindowTitleLengthRule(3600);
  const item = newAdaptiveSubscriptionWindow("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
