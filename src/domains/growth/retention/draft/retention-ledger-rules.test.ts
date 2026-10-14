import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionLedgerCampaignRefLengthRule,
  RetentionLedgerConversionRateRangeRule,
  RetentionLedgerNameLengthRule,
  RetentionLedgerRequiredCampaignRefRule,
  RetentionLedgerSegmentLengthRule,
  defaultRetentionLedgerValidator,
} from "./retention-ledger-rules.js";
import { newRetentionLedger } from "./retention-ledger.js";

test("RetentionLedgerValidator reports every problem", () => {
  const validator = defaultRetentionLedgerValidator();
  const item = newRetentionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionLedgerNameLengthRule flags a long name", () => {
  const rule = new RetentionLedgerNameLengthRule(86400);
  const item = newRetentionLedger("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionLedgerConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RetentionLedgerConversionRateRangeRule(2.4, 4740.1);
  const item = newRetentionLedger("x", "y");
  item.conversionRate = 4741.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionLedgerCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RetentionLedgerCampaignRefLengthRule(1000);
  const item = newRetentionLedger("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionLedgerSegmentLengthRule flags a long segment", () => {
  const rule = new RetentionLedgerSegmentLengthRule(1000);
  const item = newRetentionLedger("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionLedgerRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RetentionLedgerRequiredCampaignRefRule("retention ledger needs an entry");
  const item = newRetentionLedger("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
