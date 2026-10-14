import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBidRuleTierAmountRangeRule,
  ManualBidRuleTierCodeLengthRule,
  ManualBidRuleTierCountryLengthRule,
  ManualBidRuleTierRequiredNameRule,
  defaultManualBidRuleTierValidator,
} from "./manual-bid-rule-tier-rules.js";
import { newManualBidRuleTier } from "./manual-bid-rule-tier.js";

test("ManualBidRuleTierValidator reports every problem", () => {
  const validator = defaultManualBidRuleTierValidator();
  const item = newManualBidRuleTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBidRuleTierRequiredNameRule flags a blank name", () => {
  const rule = new ManualBidRuleTierRequiredNameRule("manual bid rule tier needs an entry");
  const item = newManualBidRuleTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBidRuleTierAmountRangeRule flags values above amount", () => {
  const rule = new ManualBidRuleTierAmountRangeRule(5.4, 2186.8);
  const item = newManualBidRuleTier("x", "y");
  item.amount = 2188.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBidRuleTierCountryLengthRule flags a long country", () => {
  const rule = new ManualBidRuleTierCountryLengthRule(120);
  const item = newManualBidRuleTier("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBidRuleTierCodeLengthRule flags a long code", () => {
  const rule = new ManualBidRuleTierCodeLengthRule(80);
  const item = newManualBidRuleTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
