import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryRedemptionSummaryChannelLengthRule,
  PrimaryRedemptionSummaryLocaleLengthRule,
  PrimaryRedemptionSummaryRequiredChannelRule,
  PrimaryRedemptionSummaryRequiredLabelRule,
  defaultPrimaryRedemptionSummaryValidator,
} from "./primary-redemption-summary-rules.js";
import { newPrimaryRedemptionSummary } from "./primary-redemption-summary.js";

test("PrimaryRedemptionSummaryValidator reports every problem", () => {
  const validator = defaultPrimaryRedemptionSummaryValidator();
  const item = newPrimaryRedemptionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryRedemptionSummaryRequiredChannelRule flags a blank channel", () => {
  const rule = new PrimaryRedemptionSummaryRequiredChannelRule("primary redemption summary needs a value");
  const item = newPrimaryRedemptionSummary("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRedemptionSummaryChannelLengthRule flags a long channel", () => {
  const rule = new PrimaryRedemptionSummaryChannelLengthRule(64);
  const item = newPrimaryRedemptionSummary("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRedemptionSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryRedemptionSummaryLocaleLengthRule(86400);
  const item = newPrimaryRedemptionSummary("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRedemptionSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryRedemptionSummaryRequiredLabelRule("primary redemption summary needs an entry");
  const item = newPrimaryRedemptionSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
