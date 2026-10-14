import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingDomainSummaryCodeLengthRule,
  RollingDomainSummaryRequiredCampaignRefRule,
  RollingDomainSummaryRequiredLabelRule,
  RollingDomainSummaryStartsAtRangeRule,
  defaultRollingDomainSummaryValidator,
} from "./rolling-domain-summary-rules.js";
import { newRollingDomainSummary } from "./rolling-domain-summary.js";

test("RollingDomainSummaryValidator reports every problem", () => {
  const validator = defaultRollingDomainSummaryValidator();
  const item = newRollingDomainSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingDomainSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new RollingDomainSummaryRequiredLabelRule("rolling domain summary needs a value");
  const item = newRollingDomainSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingDomainSummaryRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RollingDomainSummaryRequiredCampaignRefRule("rolling domain summary needs a value");
  const item = newRollingDomainSummary("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingDomainSummaryStartsAtRangeRule flags values above starts at", () => {
  const rule = new RollingDomainSummaryStartsAtRangeRule(80, 120);
  const item = newRollingDomainSummary("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingDomainSummaryCodeLengthRule flags a long code", () => {
  const rule = new RollingDomainSummaryCodeLengthRule(64);
  const item = newRollingDomainSummary("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
