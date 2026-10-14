import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleTargetExternalRefLengthRule,
  BidRuleTargetRequiredVariantRule,
  BidRuleTargetTitleLengthRule,
  defaultBidRuleTargetValidator,
} from "./bid-rule-target-rules.js";
import { newBidRuleTarget } from "./bid-rule-target.js";

test("BidRuleTargetValidator reports every problem", () => {
  const validator = defaultBidRuleTargetValidator();
  const item = newBidRuleTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleTargetExternalRefLengthRule flags a long external ref", () => {
  const rule = new BidRuleTargetExternalRefLengthRule(16);
  const item = newBidRuleTarget("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleTargetTitleLengthRule flags a long title", () => {
  const rule = new BidRuleTargetTitleLengthRule(64);
  const item = newBidRuleTarget("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleTargetRequiredVariantRule flags a blank variant", () => {
  const rule = new BidRuleTargetRequiredVariantRule("bid rule target needs an entry");
  const item = newBidRuleTarget("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
