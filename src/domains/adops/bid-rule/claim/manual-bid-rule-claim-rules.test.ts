import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBidRuleClaimImpressionsRangeRule,
  ManualBidRuleClaimLocaleLengthRule,
  defaultManualBidRuleClaimValidator,
} from "./manual-bid-rule-claim-rules.js";
import { newManualBidRuleClaim } from "./manual-bid-rule-claim.js";

test("ManualBidRuleClaimValidator reports every problem", () => {
  const validator = defaultManualBidRuleClaimValidator();
  const item = newManualBidRuleClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBidRuleClaimImpressionsRangeRule flags values above impressions", () => {
  const rule = new ManualBidRuleClaimImpressionsRangeRule(80, 1000);
  const item = newManualBidRuleClaim("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBidRuleClaimLocaleLengthRule flags a long locale", () => {
  const rule = new ManualBidRuleClaimLocaleLengthRule(86400);
  const item = newManualBidRuleClaim("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
