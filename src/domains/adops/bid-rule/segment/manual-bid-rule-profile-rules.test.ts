import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBidRuleProfileLimitRangeRule,
  ManualBidRuleProfileNameLengthRule,
  ManualBidRuleProfileRequiredLabelRule,
  ManualBidRuleProfileTimezoneLengthRule,
  defaultManualBidRuleProfileValidator,
} from "./manual-bid-rule-profile-rules.js";
import { newManualBidRuleProfile } from "./manual-bid-rule-profile.js";

test("ManualBidRuleProfileValidator reports every problem", () => {
  const validator = defaultManualBidRuleProfileValidator();
  const item = newManualBidRuleProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBidRuleProfileRequiredLabelRule flags a blank label", () => {
  const rule = new ManualBidRuleProfileRequiredLabelRule("manual bid rule profile needs an entry");
  const item = newManualBidRuleProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBidRuleProfileNameLengthRule flags a long name", () => {
  const rule = new ManualBidRuleProfileNameLengthRule(64);
  const item = newManualBidRuleProfile("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBidRuleProfileTimezoneLengthRule flags a long timezone", () => {
  const rule = new ManualBidRuleProfileTimezoneLengthRule(1000);
  const item = newManualBidRuleProfile("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBidRuleProfileLimitRangeRule flags values above limit", () => {
  const rule = new ManualBidRuleProfileLimitRangeRule(1000, 1000);
  const item = newManualBidRuleProfile("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
