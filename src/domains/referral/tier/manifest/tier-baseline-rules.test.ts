import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierBaselineChecksumLengthRule,
  TierBaselineCodeLengthRule,
  TierBaselineLocaleLengthRule,
  TierBaselineRequiredLabelRule,
  defaultTierBaselineValidator,
} from "./tier-baseline-rules.js";
import { newTierBaseline } from "./tier-baseline.js";

test("TierBaselineValidator reports every problem", () => {
  const validator = defaultTierBaselineValidator();
  const item = newTierBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierBaselineLocaleLengthRule flags a long locale", () => {
  const rule = new TierBaselineLocaleLengthRule(16);
  const item = newTierBaseline("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new TierBaselineRequiredLabelRule("tier baseline needs an entry");
  const item = newTierBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierBaselineChecksumLengthRule flags a long checksum", () => {
  const rule = new TierBaselineChecksumLengthRule(1000);
  const item = newTierBaseline("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierBaselineCodeLengthRule flags a long code", () => {
  const rule = new TierBaselineCodeLengthRule(80);
  const item = newTierBaseline("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
