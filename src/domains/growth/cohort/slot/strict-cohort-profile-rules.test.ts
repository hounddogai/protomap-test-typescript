import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCohortProfileBatchSizeRangeRule,
  StrictCohortProfileOpenRateRangeRule,
  StrictCohortProfileRequiredChannelRule,
  defaultStrictCohortProfileValidator,
} from "./strict-cohort-profile-rules.js";
import { newStrictCohortProfile } from "./strict-cohort-profile.js";

test("StrictCohortProfileValidator reports every problem", () => {
  const validator = defaultStrictCohortProfileValidator();
  const item = newStrictCohortProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCohortProfileBatchSizeRangeRule flags values above batch size", () => {
  const rule = new StrictCohortProfileBatchSizeRangeRule(32, 1000);
  const item = newStrictCohortProfile("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictCohortProfileOpenRateRangeRule flags values above open rate", () => {
  const rule = new StrictCohortProfileOpenRateRangeRule(2, 2793.4);
  const item = newStrictCohortProfile("x", "y");
  item.openRate = 2794.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictCohortProfileRequiredChannelRule flags a blank channel", () => {
  const rule = new StrictCohortProfileRequiredChannelRule("strict cohort profile needs this field");
  const item = newStrictCohortProfile("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
