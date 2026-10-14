import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPayoutSegmentQuantityRangeRule,
  LegacyPayoutSegmentRequiredCurrencyRule,
  LegacyPayoutSegmentUnitLengthRule,
  defaultLegacyPayoutSegmentValidator,
} from "./legacy-payout-segment-rules.js";
import { newLegacyPayoutSegment } from "./legacy-payout-segment.js";

test("LegacyPayoutSegmentValidator reports every problem", () => {
  const validator = defaultLegacyPayoutSegmentValidator();
  const item = newLegacyPayoutSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPayoutSegmentQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyPayoutSegmentQuantityRangeRule(80, 86400);
  const item = newLegacyPayoutSegment("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPayoutSegmentUnitLengthRule flags a long unit", () => {
  const rule = new LegacyPayoutSegmentUnitLengthRule(255);
  const item = newLegacyPayoutSegment("x", "y");
  item.unit = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutSegmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new LegacyPayoutSegmentRequiredCurrencyRule("legacy payout segment needs this field");
  const item = newLegacyPayoutSegment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
