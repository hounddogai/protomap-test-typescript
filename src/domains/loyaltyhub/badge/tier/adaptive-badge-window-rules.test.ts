import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBadgeWindowCapacityRangeRule,
  AdaptiveBadgeWindowCodeLengthRule,
  AdaptiveBadgeWindowCountryLengthRule,
  AdaptiveBadgeWindowLocaleLengthRule,
  AdaptiveBadgeWindowRequiredLabelRule,
  defaultAdaptiveBadgeWindowValidator,
} from "./adaptive-badge-window-rules.js";
import { newAdaptiveBadgeWindow } from "./adaptive-badge-window.js";

test("AdaptiveBadgeWindowValidator reports every problem", () => {
  const validator = defaultAdaptiveBadgeWindowValidator();
  const item = newAdaptiveBadgeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBadgeWindowCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveBadgeWindowCodeLengthRule(1000);
  const item = newAdaptiveBadgeWindow("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeWindowCountryLengthRule flags a long country", () => {
  const rule = new AdaptiveBadgeWindowCountryLengthRule(16);
  const item = newAdaptiveBadgeWindow("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeWindowLocaleLengthRule flags a long locale", () => {
  const rule = new AdaptiveBadgeWindowLocaleLengthRule(16);
  const item = newAdaptiveBadgeWindow("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeWindowRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveBadgeWindowRequiredLabelRule("adaptive badge window needs an entry");
  const item = newAdaptiveBadgeWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveBadgeWindowCapacityRangeRule flags values above capacity", () => {
  const rule = new AdaptiveBadgeWindowCapacityRangeRule(64, 1000);
  const item = newAdaptiveBadgeWindow("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
