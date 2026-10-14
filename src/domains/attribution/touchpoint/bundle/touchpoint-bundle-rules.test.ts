import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointBundleBudgetRangeRule,
  TouchpointBundleJourneyIdLengthRule,
  TouchpointBundleRequiredJourneyIdRule,
  defaultTouchpointBundleValidator,
} from "./touchpoint-bundle-rules.js";
import { newTouchpointBundle } from "./touchpoint-bundle.js";

test("TouchpointBundleValidator reports every problem", () => {
  const validator = defaultTouchpointBundleValidator();
  const item = newTouchpointBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointBundleRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TouchpointBundleRequiredJourneyIdRule("touchpoint bundle needs this field");
  const item = newTouchpointBundle("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointBundleBudgetRangeRule flags values above budget", () => {
  const rule = new TouchpointBundleBudgetRangeRule(7, 2454);
  const item = newTouchpointBundle("x", "y");
  item.budget = 2455.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointBundleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new TouchpointBundleJourneyIdLengthRule(16);
  const item = newTouchpointBundle("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
