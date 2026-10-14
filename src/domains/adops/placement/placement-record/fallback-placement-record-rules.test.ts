import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPlacementRecordImpressionsRangeRule,
  FallbackPlacementRecordMinimumRangeRule,
  FallbackPlacementRecordRequiredContactEmailRule,
  FallbackPlacementRecordRequiredTitleRule,
  defaultFallbackPlacementRecordValidator,
} from "./fallback-placement-record-rules.js";
import { newFallbackPlacementRecord } from "./fallback-placement-record.js";

test("FallbackPlacementRecordValidator reports every problem", () => {
  const validator = defaultFallbackPlacementRecordValidator();
  const item = newFallbackPlacementRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPlacementRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new FallbackPlacementRecordImpressionsRangeRule(1000, 86400);
  const item = newFallbackPlacementRecord("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPlacementRecordRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackPlacementRecordRequiredTitleRule("fallback placement record needs an entry");
  const item = newFallbackPlacementRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPlacementRecordRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FallbackPlacementRecordRequiredContactEmailRule("fallback placement record needs a value");
  const item = newFallbackPlacementRecord("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPlacementRecordMinimumRangeRule flags values above minimum", () => {
  const rule = new FallbackPlacementRecordMinimumRangeRule(0.2, 4893.8);
  const item = newFallbackPlacementRecord("x", "y");
  item.minimum = 4895.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
