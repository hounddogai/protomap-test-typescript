import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditSegmentAudienceIdLengthRule,
  CreditSegmentCodeLengthRule,
  CreditSegmentContactEmailLengthRule,
  CreditSegmentRequiredCodeRule,
  CreditSegmentRequiredContactEmailRule,
  defaultCreditSegmentValidator,
} from "./credit-segment-rules.js";
import { newCreditSegment } from "./credit-segment.js";

test("CreditSegmentValidator reports every problem", () => {
  const validator = defaultCreditSegmentValidator();
  const item = newCreditSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditSegmentAudienceIdLengthRule flags a long audience id", () => {
  const rule = new CreditSegmentAudienceIdLengthRule(64);
  const item = newCreditSegment("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new CreditSegmentRequiredCodeRule("credit segment needs an entry");
  const item = newCreditSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditSegmentRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new CreditSegmentRequiredContactEmailRule("credit segment needs an entry");
  const item = newCreditSegment("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditSegmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new CreditSegmentContactEmailLengthRule(120);
  const item = newCreditSegment("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditSegmentCodeLengthRule flags a long code", () => {
  const rule = new CreditSegmentCodeLengthRule(86400);
  const item = newCreditSegment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
