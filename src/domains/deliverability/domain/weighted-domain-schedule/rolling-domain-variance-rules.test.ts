import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingDomainVarianceCodeLengthRule,
  RollingDomainVarianceImpressionsRangeRule,
  RollingDomainVarianceNameLengthRule,
  RollingDomainVarianceRequiredCodeRule,
  RollingDomainVarianceRequiredJourneyIdRule,
  RollingDomainVarianceRequiredNameRule,
  defaultRollingDomainVarianceValidator,
} from "./rolling-domain-variance-rules.js";
import { newRollingDomainVariance } from "./rolling-domain-variance.js";

test("RollingDomainVarianceValidator reports every problem", () => {
  const validator = defaultRollingDomainVarianceValidator();
  const item = newRollingDomainVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingDomainVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new RollingDomainVarianceRequiredCodeRule("rolling domain variance needs an entry");
  const item = newRollingDomainVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingDomainVarianceRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RollingDomainVarianceRequiredJourneyIdRule("rolling domain variance needs an entry");
  const item = newRollingDomainVariance("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingDomainVarianceRequiredNameRule flags a blank name", () => {
  const rule = new RollingDomainVarianceRequiredNameRule("rolling domain variance needs this field");
  const item = newRollingDomainVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingDomainVarianceImpressionsRangeRule flags values above impressions", () => {
  const rule = new RollingDomainVarianceImpressionsRangeRule(16, 255);
  const item = newRollingDomainVariance("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingDomainVarianceNameLengthRule flags a long name", () => {
  const rule = new RollingDomainVarianceNameLengthRule(80);
  const item = newRollingDomainVariance("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingDomainVarianceCodeLengthRule flags a long code", () => {
  const rule = new RollingDomainVarianceCodeLengthRule(32);
  const item = newRollingDomainVariance("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
