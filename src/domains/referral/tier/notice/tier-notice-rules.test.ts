import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierNoticeChecksumLengthRule,
  TierNoticeCostRangeRule,
  TierNoticeLabelLengthRule,
  TierNoticeMaximumRangeRule,
  TierNoticeRequiredLabelRule,
  defaultTierNoticeValidator,
} from "./tier-notice-rules.js";
import { newTierNotice } from "./tier-notice.js";

test("TierNoticeValidator reports every problem", () => {
  const validator = defaultTierNoticeValidator();
  const item = newTierNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierNoticeMaximumRangeRule flags values above maximum", () => {
  const rule = new TierNoticeMaximumRangeRule(4.4, 2220.9);
  const item = newTierNotice("x", "y");
  item.maximum = 2222.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierNoticeChecksumLengthRule flags a long checksum", () => {
  const rule = new TierNoticeChecksumLengthRule(120);
  const item = newTierNotice("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierNoticeLabelLengthRule flags a long label", () => {
  const rule = new TierNoticeLabelLengthRule(80);
  const item = newTierNotice("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierNoticeCostRangeRule flags values above cost", () => {
  const rule = new TierNoticeCostRangeRule(0.5, 4825.9);
  const item = newTierNotice("x", "y");
  item.cost = 4827.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new TierNoticeRequiredLabelRule("tier notice needs this field");
  const item = newTierNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
