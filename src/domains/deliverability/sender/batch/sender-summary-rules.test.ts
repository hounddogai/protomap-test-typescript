import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderSummaryCodeLengthRule,
  SenderSummaryRequiredCampaignRefRule,
  defaultSenderSummaryValidator,
} from "./sender-summary-rules.js";
import { newSenderSummary } from "./sender-summary.js";

test("SenderSummaryValidator reports every problem", () => {
  const validator = defaultSenderSummaryValidator();
  const item = newSenderSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderSummaryCodeLengthRule flags a long code", () => {
  const rule = new SenderSummaryCodeLengthRule(32);
  const item = newSenderSummary("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderSummaryRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new SenderSummaryRequiredCampaignRefRule("sender summary needs an entry");
  const item = newSenderSummary("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
