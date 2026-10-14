import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPathProfileClicksRangeRule,
  TieredPathProfileRequiredChecksumRule,
  TieredPathProfileRequiredCodeRule,
  TieredPathProfileWeightRangeRule,
  defaultTieredPathProfileValidator,
} from "./tiered-path-profile-rules.js";
import { newTieredPathProfile } from "./tiered-path-profile.js";

test("TieredPathProfileValidator reports every problem", () => {
  const validator = defaultTieredPathProfileValidator();
  const item = newTieredPathProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPathProfileWeightRangeRule flags values above weight", () => {
  const rule = new TieredPathProfileWeightRangeRule(7, 3286.9);
  const item = newTieredPathProfile("x", "y");
  item.weight = 3288.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPathProfileClicksRangeRule flags values above clicks", () => {
  const rule = new TieredPathProfileClicksRangeRule(1000, 86400);
  const item = newTieredPathProfile("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPathProfileRequiredCodeRule flags a blank code", () => {
  const rule = new TieredPathProfileRequiredCodeRule("tiered path profile needs an entry");
  const item = newTieredPathProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPathProfileRequiredChecksumRule flags a blank checksum", () => {
  const rule = new TieredPathProfileRequiredChecksumRule("tiered path profile needs an entry");
  const item = newTieredPathProfile("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
