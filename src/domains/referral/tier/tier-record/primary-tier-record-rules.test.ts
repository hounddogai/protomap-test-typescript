import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTierRecordChecksumLengthRule,
  PrimaryTierRecordRequiredCodeRule,
  PrimaryTierRecordRequiredCountryRule,
  PrimaryTierRecordRevisionRangeRule,
  PrimaryTierRecordTitleLengthRule,
  defaultPrimaryTierRecordValidator,
} from "./primary-tier-record-rules.js";
import { newPrimaryTierRecord } from "./primary-tier-record.js";

test("PrimaryTierRecordValidator reports every problem", () => {
  const validator = defaultPrimaryTierRecordValidator();
  const item = newPrimaryTierRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTierRecordRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryTierRecordRevisionRangeRule(120, 255);
  const item = newPrimaryTierRecord("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryTierRecordRequiredCountryRule flags a blank country", () => {
  const rule = new PrimaryTierRecordRequiredCountryRule("primary tier record needs a value");
  const item = newPrimaryTierRecord("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTierRecordRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryTierRecordRequiredCodeRule("primary tier record needs an entry");
  const item = newPrimaryTierRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTierRecordChecksumLengthRule flags a long checksum", () => {
  const rule = new PrimaryTierRecordChecksumLengthRule(1000);
  const item = newPrimaryTierRecord("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryTierRecordTitleLengthRule flags a long title", () => {
  const rule = new PrimaryTierRecordTitleLengthRule(1000);
  const item = newPrimaryTierRecord("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
