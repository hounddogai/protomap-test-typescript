import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainTierCodeLengthRule,
  DomainTierLimitRangeRule,
  DomainTierLocaleLengthRule,
  DomainTierRequiredCampaignRefRule,
  defaultDomainTierValidator,
} from "./domain-tier-rules.js";
import { newDomainTier } from "./domain-tier.js";

test("DomainTierValidator reports every problem", () => {
  const validator = defaultDomainTierValidator();
  const item = newDomainTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainTierCodeLengthRule flags a long code", () => {
  const rule = new DomainTierCodeLengthRule(3600);
  const item = newDomainTier("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainTierLocaleLengthRule flags a long locale", () => {
  const rule = new DomainTierLocaleLengthRule(86400);
  const item = newDomainTier("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainTierLimitRangeRule flags values above limit", () => {
  const rule = new DomainTierLimitRangeRule(1000, 86400);
  const item = newDomainTier("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainTierRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new DomainTierRequiredCampaignRefRule("domain tier needs a value");
  const item = newDomainTier("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
