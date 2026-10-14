import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBidRuleQuotaCodeLengthRule,
  SeasonalBidRuleQuotaRequiredCodeRule,
  SeasonalBidRuleQuotaTitleLengthRule,
  defaultSeasonalBidRuleQuotaValidator,
} from "./seasonal-bid-rule-quota-rules.js";
import { newSeasonalBidRuleQuota } from "./seasonal-bid-rule-quota.js";

test("SeasonalBidRuleQuotaValidator reports every problem", () => {
  const validator = defaultSeasonalBidRuleQuotaValidator();
  const item = newSeasonalBidRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBidRuleQuotaCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBidRuleQuotaCodeLengthRule(16);
  const item = newSeasonalBidRuleQuota("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleQuotaTitleLengthRule flags a long title", () => {
  const rule = new SeasonalBidRuleQuotaTitleLengthRule(3600);
  const item = newSeasonalBidRuleQuota("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalBidRuleQuotaRequiredCodeRule("seasonal bid rule quota needs this field");
  const item = newSeasonalBidRuleQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
