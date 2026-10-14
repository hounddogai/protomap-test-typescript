import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredReplyPreferenceAudienceIdLengthRule,
  TieredReplyPreferenceFloorValueRangeRule,
  TieredReplyPreferenceRequiredNameRule,
  TieredReplyPreferenceUnitLengthRule,
  defaultTieredReplyPreferenceValidator,
} from "./tiered-reply-preference-rules.js";
import { newTieredReplyPreference } from "./tiered-reply-preference.js";

test("TieredReplyPreferenceValidator reports every problem", () => {
  const validator = defaultTieredReplyPreferenceValidator();
  const item = newTieredReplyPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredReplyPreferenceFloorValueRangeRule flags values above floor value", () => {
  const rule = new TieredReplyPreferenceFloorValueRangeRule(2.7, 4598.2);
  const item = newTieredReplyPreference("x", "y");
  item.floorValue = 4599.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredReplyPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new TieredReplyPreferenceRequiredNameRule("tiered reply preference needs an entry");
  const item = newTieredReplyPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredReplyPreferenceUnitLengthRule flags a long unit", () => {
  const rule = new TieredReplyPreferenceUnitLengthRule(80);
  const item = newTieredReplyPreference("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredReplyPreferenceAudienceIdLengthRule flags a long audience id", () => {
  const rule = new TieredReplyPreferenceAudienceIdLengthRule(3600);
  const item = newTieredReplyPreference("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
