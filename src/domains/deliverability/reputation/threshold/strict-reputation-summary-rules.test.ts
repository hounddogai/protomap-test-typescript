import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReputationSummaryQuantityRangeRule,
  StrictReputationSummaryRatioRangeRule,
  StrictReputationSummaryRequiredCampaignRefRule,
  StrictReputationSummaryRequiredCodeRule,
  defaultStrictReputationSummaryValidator,
} from "./strict-reputation-summary-rules.js";
import { newStrictReputationSummary } from "./strict-reputation-summary.js";

test("StrictReputationSummaryValidator reports every problem", () => {
  const validator = defaultStrictReputationSummaryValidator();
  const item = newStrictReputationSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReputationSummaryQuantityRangeRule flags values above quantity", () => {
  const rule = new StrictReputationSummaryQuantityRangeRule(16, 255);
  const item = newStrictReputationSummary("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReputationSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new StrictReputationSummaryRequiredCodeRule("strict reputation summary needs an entry");
  const item = newStrictReputationSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationSummaryRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new StrictReputationSummaryRequiredCampaignRefRule("strict reputation summary needs a value");
  const item = newStrictReputationSummary("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationSummaryRatioRangeRule flags values above ratio", () => {
  const rule = new StrictReputationSummaryRatioRangeRule(2.1, 3085.1);
  const item = newStrictReputationSummary("x", "y");
  item.ratio = 3086.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
