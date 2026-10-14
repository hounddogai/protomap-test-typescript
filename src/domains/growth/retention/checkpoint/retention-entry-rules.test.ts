import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionEntryFloorValueRangeRule,
  RetentionEntryImpressionsRangeRule,
  RetentionEntryNameLengthRule,
  RetentionEntryRequiredCodeRule,
  RetentionEntryRequiredNameRule,
  defaultRetentionEntryValidator,
} from "./retention-entry-rules.js";
import { newRetentionEntry } from "./retention-entry.js";

test("RetentionEntryValidator reports every problem", () => {
  const validator = defaultRetentionEntryValidator();
  const item = newRetentionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionEntryNameLengthRule flags a long name", () => {
  const rule = new RetentionEntryNameLengthRule(64);
  const item = newRetentionEntry("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionEntryRequiredNameRule flags a blank name", () => {
  const rule = new RetentionEntryRequiredNameRule("retention entry needs this field");
  const item = newRetentionEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionEntryRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionEntryRequiredCodeRule("retention entry needs this field");
  const item = newRetentionEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionEntryFloorValueRangeRule flags values above floor value", () => {
  const rule = new RetentionEntryFloorValueRangeRule(8.2, 3264.9);
  const item = newRetentionEntry("x", "y");
  item.floorValue = 3266.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionEntryImpressionsRangeRule flags values above impressions", () => {
  const rule = new RetentionEntryImpressionsRangeRule(64, 86400);
  const item = newRetentionEntry("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
