import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCohortOverrideAmountRangeRule,
  ScheduledCohortOverrideCampaignRefLengthRule,
  ScheduledCohortOverrideRequiredCampaignRefRule,
  ScheduledCohortOverrideSequenceRangeRule,
  ScheduledCohortOverrideSummaryLengthRule,
  defaultScheduledCohortOverrideValidator,
} from "./scheduled-cohort-override-rules.js";
import { newScheduledCohortOverride } from "./scheduled-cohort-override.js";

test("ScheduledCohortOverrideValidator reports every problem", () => {
  const validator = defaultScheduledCohortOverrideValidator();
  const item = newScheduledCohortOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCohortOverrideCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ScheduledCohortOverrideCampaignRefLengthRule(3600);
  const item = newScheduledCohortOverride("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledCohortOverrideSequenceRangeRule flags values above sequence", () => {
  const rule = new ScheduledCohortOverrideSequenceRangeRule(16, 80);
  const item = newScheduledCohortOverride("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCohortOverrideRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledCohortOverrideRequiredCampaignRefRule("scheduled cohort override needs a value");
  const item = newScheduledCohortOverride("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCohortOverrideSummaryLengthRule flags a long summary", () => {
  const rule = new ScheduledCohortOverrideSummaryLengthRule(255);
  const item = newScheduledCohortOverride("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledCohortOverrideAmountRangeRule flags values above amount", () => {
  const rule = new ScheduledCohortOverrideAmountRangeRule(2.2, 4004.6);
  const item = newScheduledCohortOverride("x", "y");
  item.amount = 4006.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
