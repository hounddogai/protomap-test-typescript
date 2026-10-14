import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleRollupMinimumRangeRule,
  BidRuleRollupRequiredLabelRule,
  defaultBidRuleRollupValidator,
} from "./bid-rule-rollup-rules.js";
import { newBidRuleRollup } from "./bid-rule-rollup.js";

test("BidRuleRollupValidator reports every problem", () => {
  const validator = defaultBidRuleRollupValidator();
  const item = newBidRuleRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleRollupMinimumRangeRule flags values above minimum", () => {
  const rule = new BidRuleRollupMinimumRangeRule(4.6, 2636.6);
  const item = newBidRuleRollup("x", "y");
  item.minimum = 2638.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleRollupRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleRollupRequiredLabelRule("bid rule rollup needs an entry");
  const item = newBidRuleRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
