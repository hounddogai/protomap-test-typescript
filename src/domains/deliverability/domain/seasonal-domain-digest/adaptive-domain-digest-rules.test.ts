import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDomainDigestBatchSizeRangeRule,
  AdaptiveDomainDigestCodeLengthRule,
  AdaptiveDomainDigestRequiredCodeRule,
  AdaptiveDomainDigestRequiredUnitRule,
  AdaptiveDomainDigestUnitLengthRule,
  AdaptiveDomainDigestWindowDaysRangeRule,
  defaultAdaptiveDomainDigestValidator,
} from "./adaptive-domain-digest-rules.js";
import { newAdaptiveDomainDigest } from "./adaptive-domain-digest.js";

test("AdaptiveDomainDigestValidator reports every problem", () => {
  const validator = defaultAdaptiveDomainDigestValidator();
  const item = newAdaptiveDomainDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDomainDigestBatchSizeRangeRule flags values above batch size", () => {
  const rule = new AdaptiveDomainDigestBatchSizeRangeRule(255, 1000);
  const item = newAdaptiveDomainDigest("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDomainDigestRequiredUnitRule flags a blank unit", () => {
  const rule = new AdaptiveDomainDigestRequiredUnitRule("adaptive domain digest needs a value");
  const item = newAdaptiveDomainDigest("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainDigestRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDomainDigestRequiredCodeRule("adaptive domain digest needs an entry");
  const item = newAdaptiveDomainDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainDigestCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveDomainDigestCodeLengthRule(1000);
  const item = newAdaptiveDomainDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDomainDigestUnitLengthRule flags a long unit", () => {
  const rule = new AdaptiveDomainDigestUnitLengthRule(120);
  const item = newAdaptiveDomainDigest("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDomainDigestWindowDaysRangeRule flags values above window days", () => {
  const rule = new AdaptiveDomainDigestWindowDaysRangeRule(255, 1000);
  const item = newAdaptiveDomainDigest("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
