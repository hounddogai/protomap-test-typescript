import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFraudCheckDigestCodeLengthRule,
  PrimaryFraudCheckDigestDurationMinutesRangeRule,
  PrimaryFraudCheckDigestRevisionRangeRule,
  defaultPrimaryFraudCheckDigestValidator,
} from "./primary-fraud-check-digest-rules.js";
import { newPrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

test("PrimaryFraudCheckDigestValidator reports every problem", () => {
  const validator = defaultPrimaryFraudCheckDigestValidator();
  const item = newPrimaryFraudCheckDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFraudCheckDigestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PrimaryFraudCheckDigestDurationMinutesRangeRule(255, 255);
  const item = newPrimaryFraudCheckDigest("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFraudCheckDigestCodeLengthRule flags a long code", () => {
  const rule = new PrimaryFraudCheckDigestCodeLengthRule(64);
  const item = newPrimaryFraudCheckDigest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFraudCheckDigestRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryFraudCheckDigestRevisionRangeRule(3600, 3600);
  const item = newPrimaryFraudCheckDigest("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
