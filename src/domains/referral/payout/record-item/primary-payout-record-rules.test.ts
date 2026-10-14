import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPayoutRecordChannelLengthRule,
  PrimaryPayoutRecordEndsAtRangeRule,
  PrimaryPayoutRecordRequiredNameRule,
  PrimaryPayoutRecordTimezoneLengthRule,
  defaultPrimaryPayoutRecordValidator,
} from "./primary-payout-record-rules.js";
import { newPrimaryPayoutRecord } from "./primary-payout-record.js";

test("PrimaryPayoutRecordValidator reports every problem", () => {
  const validator = defaultPrimaryPayoutRecordValidator();
  const item = newPrimaryPayoutRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPayoutRecordEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryPayoutRecordEndsAtRangeRule(32, 86400);
  const item = newPrimaryPayoutRecord("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPayoutRecordTimezoneLengthRule flags a long timezone", () => {
  const rule = new PrimaryPayoutRecordTimezoneLengthRule(1000);
  const item = newPrimaryPayoutRecord("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPayoutRecordRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryPayoutRecordRequiredNameRule("primary payout record needs an entry");
  const item = newPrimaryPayoutRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPayoutRecordChannelLengthRule flags a long channel", () => {
  const rule = new PrimaryPayoutRecordChannelLengthRule(64);
  const item = newPrimaryPayoutRecord("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
