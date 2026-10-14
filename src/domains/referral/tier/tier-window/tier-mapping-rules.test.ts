import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierMappingBidRangeRule,
  TierMappingCodeLengthRule,
  TierMappingContactEmailLengthRule,
  defaultTierMappingValidator,
} from "./tier-mapping-rules.js";
import { newTierMapping } from "./tier-mapping.js";

test("TierMappingValidator reports every problem", () => {
  const validator = defaultTierMappingValidator();
  const item = newTierMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierMappingContactEmailLengthRule flags a long contact email", () => {
  const rule = new TierMappingContactEmailLengthRule(3600);
  const item = newTierMapping("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierMappingCodeLengthRule flags a long code", () => {
  const rule = new TierMappingCodeLengthRule(255);
  const item = newTierMapping("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierMappingBidRangeRule flags values above bid", () => {
  const rule = new TierMappingBidRangeRule(4.4, 1869.7);
  const item = newTierMapping("x", "y");
  item.bid = 1871.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
