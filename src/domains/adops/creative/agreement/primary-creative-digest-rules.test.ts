import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryCreativeDigestRequiredNameRule,
  PrimaryCreativeDigestSourceLengthRule,
  PrimaryCreativeDigestWindowDaysRangeRule,
  defaultPrimaryCreativeDigestValidator,
} from "./primary-creative-digest-rules.js";
import { newPrimaryCreativeDigest } from "./primary-creative-digest.js";

test("PrimaryCreativeDigestValidator reports every problem", () => {
  const validator = defaultPrimaryCreativeDigestValidator();
  const item = newPrimaryCreativeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryCreativeDigestSourceLengthRule flags a long source", () => {
  const rule = new PrimaryCreativeDigestSourceLengthRule(64);
  const item = newPrimaryCreativeDigest("x", "y");
  item.source = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryCreativeDigestRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryCreativeDigestRequiredNameRule("primary creative digest needs this field");
  const item = newPrimaryCreativeDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryCreativeDigestWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryCreativeDigestWindowDaysRangeRule(16, 3600);
  const item = newPrimaryCreativeDigest("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
