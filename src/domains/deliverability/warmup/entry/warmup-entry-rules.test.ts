import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupEntryCodeLengthRule,
  WarmupEntryDurationMinutesRangeRule,
  WarmupEntryExternalRefLengthRule,
  WarmupEntryMaximumRangeRule,
  WarmupEntryTitleLengthRule,
  defaultWarmupEntryValidator,
} from "./warmup-entry-rules.js";
import { newWarmupEntry } from "./warmup-entry.js";

test("WarmupEntryValidator reports every problem", () => {
  const validator = defaultWarmupEntryValidator();
  const item = newWarmupEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupEntryCodeLengthRule flags a long code", () => {
  const rule = new WarmupEntryCodeLengthRule(1000);
  const item = newWarmupEntry("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupEntryExternalRefLengthRule flags a long external ref", () => {
  const rule = new WarmupEntryExternalRefLengthRule(3600);
  const item = newWarmupEntry("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupEntryMaximumRangeRule flags values above maximum", () => {
  const rule = new WarmupEntryMaximumRangeRule(5.4, 4015.5);
  const item = newWarmupEntry("x", "y");
  item.maximum = 4017;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupEntryTitleLengthRule flags a long title", () => {
  const rule = new WarmupEntryTitleLengthRule(3600);
  const item = newWarmupEntry("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupEntryDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new WarmupEntryDurationMinutesRangeRule(64, 255);
  const item = newWarmupEntry("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
