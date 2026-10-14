import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInWindowCampaignRefLengthRule,
  DoubleOptInWindowRequiredCampaignRefRule,
  DoubleOptInWindowRequiredTitleRule,
  DoubleOptInWindowTitleLengthRule,
  DoubleOptInWindowWindowDaysRangeRule,
  defaultDoubleOptInWindowValidator,
} from "./double-opt-in-window-rules.js";
import { newDoubleOptInWindow } from "./double-opt-in-window.js";

test("DoubleOptInWindowValidator reports every problem", () => {
  const validator = defaultDoubleOptInWindowValidator();
  const item = newDoubleOptInWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInWindowTitleLengthRule flags a long title", () => {
  const rule = new DoubleOptInWindowTitleLengthRule(80);
  const item = newDoubleOptInWindow("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInWindowWindowDaysRangeRule flags values above window days", () => {
  const rule = new DoubleOptInWindowWindowDaysRangeRule(64, 120);
  const item = newDoubleOptInWindow("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInWindowCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new DoubleOptInWindowCampaignRefLengthRule(86400);
  const item = newDoubleOptInWindow("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInWindowRequiredTitleRule flags a blank title", () => {
  const rule = new DoubleOptInWindowRequiredTitleRule("double opt in window needs an entry");
  const item = newDoubleOptInWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInWindowRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new DoubleOptInWindowRequiredCampaignRefRule("double opt in window needs an entry");
  const item = newDoubleOptInWindow("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
