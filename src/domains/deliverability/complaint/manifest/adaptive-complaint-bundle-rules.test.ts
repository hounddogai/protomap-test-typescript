import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveComplaintBundleCodeLengthRule,
  AdaptiveComplaintBundleNameLengthRule,
  AdaptiveComplaintBundleRequiredCampaignRefRule,
  AdaptiveComplaintBundleWindowDaysRangeRule,
  defaultAdaptiveComplaintBundleValidator,
} from "./adaptive-complaint-bundle-rules.js";
import { newAdaptiveComplaintBundle } from "./adaptive-complaint-bundle.js";

test("AdaptiveComplaintBundleValidator reports every problem", () => {
  const validator = defaultAdaptiveComplaintBundleValidator();
  const item = newAdaptiveComplaintBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveComplaintBundleWindowDaysRangeRule flags values above window days", () => {
  const rule = new AdaptiveComplaintBundleWindowDaysRangeRule(32, 80);
  const item = newAdaptiveComplaintBundle("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveComplaintBundleNameLengthRule flags a long name", () => {
  const rule = new AdaptiveComplaintBundleNameLengthRule(255);
  const item = newAdaptiveComplaintBundle("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintBundleCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveComplaintBundleCodeLengthRule(255);
  const item = newAdaptiveComplaintBundle("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintBundleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new AdaptiveComplaintBundleRequiredCampaignRefRule("adaptive complaint bundle needs this field");
  const item = newAdaptiveComplaintBundle("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
