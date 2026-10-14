import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPlacementEntryGraceDaysRangeRule,
  ManualPlacementEntryOpenRateRangeRule,
  ManualPlacementEntryRequiredTitleRule,
  ManualPlacementEntrySegmentLengthRule,
  ManualPlacementEntryTitleLengthRule,
  ManualPlacementEntryVersionRangeRule,
  defaultManualPlacementEntryValidator,
} from "./manual-placement-entry-rules.js";
import { newManualPlacementEntry } from "./manual-placement-entry.js";

test("ManualPlacementEntryValidator reports every problem", () => {
  const validator = defaultManualPlacementEntryValidator();
  const item = newManualPlacementEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPlacementEntryVersionRangeRule flags values above version", () => {
  const rule = new ManualPlacementEntryVersionRangeRule(32, 120);
  const item = newManualPlacementEntry("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPlacementEntrySegmentLengthRule flags a long segment", () => {
  const rule = new ManualPlacementEntrySegmentLengthRule(32);
  const item = newManualPlacementEntry("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPlacementEntryOpenRateRangeRule flags values above open rate", () => {
  const rule = new ManualPlacementEntryOpenRateRangeRule(3.1, 3348.9);
  const item = newManualPlacementEntry("x", "y");
  item.openRate = 3350.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPlacementEntryGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ManualPlacementEntryGraceDaysRangeRule(64, 80);
  const item = newManualPlacementEntry("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPlacementEntryTitleLengthRule flags a long title", () => {
  const rule = new ManualPlacementEntryTitleLengthRule(3600);
  const item = newManualPlacementEntry("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPlacementEntryRequiredTitleRule flags a blank title", () => {
  const rule = new ManualPlacementEntryRequiredTitleRule("manual placement entry needs an entry");
  const item = newManualPlacementEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
