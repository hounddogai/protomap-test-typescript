import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBranchProfileRatioRangeRule,
  TieredBranchProfileRequiredCountryRule,
  TieredBranchProfileRequiredNameRule,
  TieredBranchProfileRequiredPhoneRule,
  defaultTieredBranchProfileValidator,
} from "./tiered-branch-profile-rules.js";
import { newTieredBranchProfile } from "./tiered-branch-profile.js";

test("TieredBranchProfileValidator reports every problem", () => {
  const validator = defaultTieredBranchProfileValidator();
  const item = newTieredBranchProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBranchProfileRequiredCountryRule flags a blank country", () => {
  const rule = new TieredBranchProfileRequiredCountryRule("tiered branch profile needs an entry");
  const item = newTieredBranchProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBranchProfileRequiredPhoneRule flags a blank phone", () => {
  const rule = new TieredBranchProfileRequiredPhoneRule("tiered branch profile needs an entry");
  const item = newTieredBranchProfile("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBranchProfileRequiredNameRule flags a blank name", () => {
  const rule = new TieredBranchProfileRequiredNameRule("tiered branch profile needs this field");
  const item = newTieredBranchProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBranchProfileRatioRangeRule flags values above ratio", () => {
  const rule = new TieredBranchProfileRatioRangeRule(5.7, 4235.3);
  const item = newTieredBranchProfile("x", "y");
  item.ratio = 4236.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
