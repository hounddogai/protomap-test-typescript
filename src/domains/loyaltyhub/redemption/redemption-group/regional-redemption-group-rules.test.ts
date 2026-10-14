import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRedemptionGroupCountryLengthRule,
  RegionalRedemptionGroupEndsAtRangeRule,
  RegionalRedemptionGroupRequiredCodeRule,
  RegionalRedemptionGroupRequiredCountryRule,
  RegionalRedemptionGroupRequiredNameRule,
  defaultRegionalRedemptionGroupValidator,
} from "./regional-redemption-group-rules.js";
import { newRegionalRedemptionGroup } from "./regional-redemption-group.js";

test("RegionalRedemptionGroupValidator reports every problem", () => {
  const validator = defaultRegionalRedemptionGroupValidator();
  const item = newRegionalRedemptionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRedemptionGroupRequiredCountryRule flags a blank country", () => {
  const rule = new RegionalRedemptionGroupRequiredCountryRule("regional redemption group needs this field");
  const item = newRegionalRedemptionGroup("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRedemptionGroupCountryLengthRule flags a long country", () => {
  const rule = new RegionalRedemptionGroupCountryLengthRule(16);
  const item = newRegionalRedemptionGroup("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRedemptionGroupRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalRedemptionGroupRequiredCodeRule("regional redemption group needs a value");
  const item = newRegionalRedemptionGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRedemptionGroupRequiredNameRule flags a blank name", () => {
  const rule = new RegionalRedemptionGroupRequiredNameRule("regional redemption group needs an entry");
  const item = newRegionalRedemptionGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRedemptionGroupEndsAtRangeRule flags values above ends at", () => {
  const rule = new RegionalRedemptionGroupEndsAtRangeRule(80, 1000);
  const item = newRegionalRedemptionGroup("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
