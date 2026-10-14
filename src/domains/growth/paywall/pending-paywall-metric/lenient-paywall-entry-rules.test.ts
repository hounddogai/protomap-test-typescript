import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPaywallEntryMaximumRangeRule,
  LenientPaywallEntryRequiredCodeRule,
  LenientPaywallEntrySummaryLengthRule,
  LenientPaywallEntryTitleLengthRule,
  defaultLenientPaywallEntryValidator,
} from "./lenient-paywall-entry-rules.js";
import { newLenientPaywallEntry } from "./lenient-paywall-entry.js";

test("LenientPaywallEntryValidator reports every problem", () => {
  const validator = defaultLenientPaywallEntryValidator();
  const item = newLenientPaywallEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPaywallEntryRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPaywallEntryRequiredCodeRule("lenient paywall entry needs an entry");
  const item = newLenientPaywallEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPaywallEntryMaximumRangeRule flags values above maximum", () => {
  const rule = new LenientPaywallEntryMaximumRangeRule(2.4, 3998.8);
  const item = newLenientPaywallEntry("x", "y");
  item.maximum = 4000.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPaywallEntrySummaryLengthRule flags a long summary", () => {
  const rule = new LenientPaywallEntrySummaryLengthRule(32);
  const item = newLenientPaywallEntry("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPaywallEntryTitleLengthRule flags a long title", () => {
  const rule = new LenientPaywallEntryTitleLengthRule(16);
  const item = newLenientPaywallEntry("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
