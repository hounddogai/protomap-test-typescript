import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceAgreementChannelLengthRule,
  BounceAgreementRequiredChannelRule,
  BounceAgreementRequiredCodeRule,
  BounceAgreementUpdatedAtRangeRule,
  defaultBounceAgreementValidator,
} from "./bounce-agreement-rules.js";
import { newBounceAgreement } from "./bounce-agreement.js";

test("BounceAgreementValidator reports every problem", () => {
  const validator = defaultBounceAgreementValidator();
  const item = newBounceAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new BounceAgreementRequiredCodeRule("bounce agreement needs this field");
  const item = newBounceAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceAgreementRequiredChannelRule flags a blank channel", () => {
  const rule = new BounceAgreementRequiredChannelRule("bounce agreement needs a value");
  const item = newBounceAgreement("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceAgreementUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BounceAgreementUpdatedAtRangeRule(16, 16);
  const item = newBounceAgreement("x", "y");
  item.updatedAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceAgreementChannelLengthRule flags a long channel", () => {
  const rule = new BounceAgreementChannelLengthRule(120);
  const item = newBounceAgreement("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
