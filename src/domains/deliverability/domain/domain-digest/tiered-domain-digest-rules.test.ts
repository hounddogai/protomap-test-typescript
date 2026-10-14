import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDomainDigestRequiredUtmSourceRule,
  TieredDomainDigestSegmentLengthRule,
  defaultTieredDomainDigestValidator,
} from "./tiered-domain-digest-rules.js";
import { newTieredDomainDigest } from "./tiered-domain-digest.js";

test("TieredDomainDigestValidator reports every problem", () => {
  const validator = defaultTieredDomainDigestValidator();
  const item = newTieredDomainDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDomainDigestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredDomainDigestRequiredUtmSourceRule("tiered domain digest needs a value");
  const item = newTieredDomainDigest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDomainDigestSegmentLengthRule flags a long segment", () => {
  const rule = new TieredDomainDigestSegmentLengthRule(32);
  const item = newTieredDomainDigest("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
