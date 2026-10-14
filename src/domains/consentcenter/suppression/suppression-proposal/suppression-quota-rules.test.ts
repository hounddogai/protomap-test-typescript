import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionQuotaCampaignRefLengthRule,
  SuppressionQuotaCodeLengthRule,
  SuppressionQuotaCostRangeRule,
  SuppressionQuotaLabelLengthRule,
  SuppressionQuotaRequiredCampaignRefRule,
  SuppressionQuotaRequiredCodeRule,
  defaultSuppressionQuotaValidator,
} from "./suppression-quota-rules.js";
import { newSuppressionQuota } from "./suppression-quota.js";

test("SuppressionQuotaValidator reports every problem", () => {
  const validator = defaultSuppressionQuotaValidator();
  const item = newSuppressionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionQuotaLabelLengthRule flags a long label", () => {
  const rule = new SuppressionQuotaLabelLengthRule(64);
  const item = newSuppressionQuota("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionQuotaCodeLengthRule flags a long code", () => {
  const rule = new SuppressionQuotaCodeLengthRule(3600);
  const item = newSuppressionQuota("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionQuotaRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new SuppressionQuotaRequiredCampaignRefRule("suppression quota needs a value");
  const item = newSuppressionQuota("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionQuotaCostRangeRule flags values above cost", () => {
  const rule = new SuppressionQuotaCostRangeRule(2.3, 2172.2);
  const item = newSuppressionQuota("x", "y");
  item.cost = 2173.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionQuotaCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new SuppressionQuotaCampaignRefLengthRule(120);
  const item = newSuppressionQuota("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionQuotaRequiredCodeRule("suppression quota needs this field");
  const item = newSuppressionQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
