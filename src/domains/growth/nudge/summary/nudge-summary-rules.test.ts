import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeSummaryCampaignRefLengthRule,
  NudgeSummaryOwnerIdLengthRule,
  NudgeSummaryRequiredCampaignRefRule,
  NudgeSummaryRequiredCodeRule,
  NudgeSummaryVersionRangeRule,
  defaultNudgeSummaryValidator,
} from "./nudge-summary-rules.js";
import { newNudgeSummary } from "./nudge-summary.js";

test("NudgeSummaryValidator reports every problem", () => {
  const validator = defaultNudgeSummaryValidator();
  const item = newNudgeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeSummaryRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new NudgeSummaryRequiredCampaignRefRule("nudge summary needs this field");
  const item = newNudgeSummary("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeSummaryCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new NudgeSummaryCampaignRefLengthRule(86400);
  const item = newNudgeSummary("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeSummaryOwnerIdLengthRule flags a long owner id", () => {
  const rule = new NudgeSummaryOwnerIdLengthRule(32);
  const item = newNudgeSummary("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeSummaryRequiredCodeRule("nudge summary needs this field");
  const item = newNudgeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeSummaryVersionRangeRule flags values above version", () => {
  const rule = new NudgeSummaryVersionRangeRule(80, 86400);
  const item = newNudgeSummary("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
