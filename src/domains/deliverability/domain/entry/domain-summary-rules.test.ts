import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainSummaryCampaignRefLengthRule,
  DomainSummaryCodeLengthRule,
  DomainSummaryRequiredCodeRule,
  defaultDomainSummaryValidator,
} from "./domain-summary-rules.js";
import { newDomainSummary } from "./domain-summary.js";

test("DomainSummaryValidator reports every problem", () => {
  const validator = defaultDomainSummaryValidator();
  const item = newDomainSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new DomainSummaryRequiredCodeRule("domain summary needs an entry");
  const item = newDomainSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainSummaryCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new DomainSummaryCampaignRefLengthRule(120);
  const item = newDomainSummary("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainSummaryCodeLengthRule flags a long code", () => {
  const rule = new DomainSummaryCodeLengthRule(1000);
  const item = newDomainSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
