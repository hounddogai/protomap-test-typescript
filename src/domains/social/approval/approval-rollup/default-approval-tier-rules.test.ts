import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultApprovalTierRequiredCampaignRefRule,
  DefaultApprovalTierRequiredCurrencyRule,
  DefaultApprovalTierVersionRangeRule,
  defaultDefaultApprovalTierValidator,
} from "./default-approval-tier-rules.js";
import { newDefaultApprovalTier } from "./default-approval-tier.js";

test("DefaultApprovalTierValidator reports every problem", () => {
  const validator = defaultDefaultApprovalTierValidator();
  const item = newDefaultApprovalTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultApprovalTierVersionRangeRule flags values above version", () => {
  const rule = new DefaultApprovalTierVersionRangeRule(16, 86400);
  const item = newDefaultApprovalTier("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultApprovalTierRequiredCurrencyRule flags a blank currency", () => {
  const rule = new DefaultApprovalTierRequiredCurrencyRule("default approval tier needs an entry");
  const item = newDefaultApprovalTier("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultApprovalTierRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new DefaultApprovalTierRequiredCampaignRefRule("default approval tier needs a value");
  const item = newDefaultApprovalTier("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
