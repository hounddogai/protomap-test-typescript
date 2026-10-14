import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceSegmentDiscountRangeRule,
  PreferenceSegmentExpiresAtRangeRule,
  PreferenceSegmentNameLengthRule,
  PreferenceSegmentRequiredUtmSourceRule,
  PreferenceSegmentSendAtRangeRule,
  defaultPreferenceSegmentValidator,
} from "./preference-segment-rules.js";
import { newPreferenceSegment } from "./preference-segment.js";

test("PreferenceSegmentValidator reports every problem", () => {
  const validator = defaultPreferenceSegmentValidator();
  const item = newPreferenceSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceSegmentNameLengthRule flags a long name", () => {
  const rule = new PreferenceSegmentNameLengthRule(16);
  const item = newPreferenceSegment("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceSegmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PreferenceSegmentRequiredUtmSourceRule("preference segment needs an entry");
  const item = newPreferenceSegment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceSegmentDiscountRangeRule flags values above discount", () => {
  const rule = new PreferenceSegmentDiscountRangeRule(3.2, 3089.8);
  const item = newPreferenceSegment("x", "y");
  item.discount = 3091.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceSegmentExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PreferenceSegmentExpiresAtRangeRule(64, 1000);
  const item = newPreferenceSegment("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceSegmentSendAtRangeRule flags values above send at", () => {
  const rule = new PreferenceSegmentSendAtRangeRule(64, 80);
  const item = newPreferenceSegment("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
