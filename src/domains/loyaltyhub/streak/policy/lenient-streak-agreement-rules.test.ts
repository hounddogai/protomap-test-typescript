import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientStreakAgreementExpiresAtRangeRule,
  LenientStreakAgreementLabelLengthRule,
  LenientStreakAgreementRequiredLabelRule,
  LenientStreakAgreementRequiredNameRule,
  LenientStreakAgreementUtmSourceLengthRule,
  defaultLenientStreakAgreementValidator,
} from "./lenient-streak-agreement-rules.js";
import { newLenientStreakAgreement } from "./lenient-streak-agreement.js";

test("LenientStreakAgreementValidator reports every problem", () => {
  const validator = defaultLenientStreakAgreementValidator();
  const item = newLenientStreakAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientStreakAgreementLabelLengthRule flags a long label", () => {
  const rule = new LenientStreakAgreementLabelLengthRule(86400);
  const item = newLenientStreakAgreement("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientStreakAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new LenientStreakAgreementRequiredLabelRule("lenient streak agreement needs an entry");
  const item = newLenientStreakAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakAgreementExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LenientStreakAgreementExpiresAtRangeRule(1000, 86400);
  const item = newLenientStreakAgreement("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientStreakAgreementRequiredNameRule flags a blank name", () => {
  const rule = new LenientStreakAgreementRequiredNameRule("lenient streak agreement needs a value");
  const item = newLenientStreakAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakAgreementUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientStreakAgreementUtmSourceLengthRule(255);
  const item = newLenientStreakAgreement("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
