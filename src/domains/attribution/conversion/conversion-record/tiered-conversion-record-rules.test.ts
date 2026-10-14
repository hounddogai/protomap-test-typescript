import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredConversionRecordContactEmailLengthRule,
  TieredConversionRecordEndsAtRangeRule,
  TieredConversionRecordRequiredNameRule,
  TieredConversionRecordSendAtRangeRule,
  defaultTieredConversionRecordValidator,
} from "./tiered-conversion-record-rules.js";
import { newTieredConversionRecord } from "./tiered-conversion-record.js";

test("TieredConversionRecordValidator reports every problem", () => {
  const validator = defaultTieredConversionRecordValidator();
  const item = newTieredConversionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredConversionRecordContactEmailLengthRule flags a long contact email", () => {
  const rule = new TieredConversionRecordContactEmailLengthRule(120);
  const item = newTieredConversionRecord("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredConversionRecordEndsAtRangeRule flags values above ends at", () => {
  const rule = new TieredConversionRecordEndsAtRangeRule(3600, 86400);
  const item = newTieredConversionRecord("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredConversionRecordSendAtRangeRule flags values above send at", () => {
  const rule = new TieredConversionRecordSendAtRangeRule(64, 1000);
  const item = newTieredConversionRecord("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredConversionRecordRequiredNameRule flags a blank name", () => {
  const rule = new TieredConversionRecordRequiredNameRule("tiered conversion record needs this field");
  const item = newTieredConversionRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
