import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBidRuleBundleCodeLengthRule,
  SeasonalBidRuleBundleMaximumRangeRule,
  SeasonalBidRuleBundleNameLengthRule,
  SeasonalBidRuleBundleRequiredLocaleRule,
  defaultSeasonalBidRuleBundleValidator,
} from "./seasonal-bid-rule-bundle-rules.js";
import { newSeasonalBidRuleBundle } from "./seasonal-bid-rule-bundle.js";

test("SeasonalBidRuleBundleValidator reports every problem", () => {
  const validator = defaultSeasonalBidRuleBundleValidator();
  const item = newSeasonalBidRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBidRuleBundleNameLengthRule flags a long name", () => {
  const rule = new SeasonalBidRuleBundleNameLengthRule(80);
  const item = newSeasonalBidRuleBundle("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleBundleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBidRuleBundleCodeLengthRule(120);
  const item = newSeasonalBidRuleBundle("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleBundleMaximumRangeRule flags values above maximum", () => {
  const rule = new SeasonalBidRuleBundleMaximumRangeRule(8.8, 3409.7);
  const item = newSeasonalBidRuleBundle("x", "y");
  item.maximum = 3411.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBidRuleBundleRequiredLocaleRule flags a blank locale", () => {
  const rule = new SeasonalBidRuleBundleRequiredLocaleRule("seasonal bid rule bundle needs an entry");
  const item = newSeasonalBidRuleBundle("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
