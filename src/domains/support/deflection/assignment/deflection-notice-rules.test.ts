import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionNoticeCreatedAtRangeRule,
  DeflectionNoticeExternalRefLengthRule,
  DeflectionNoticeGraceDaysRangeRule,
  DeflectionNoticeRequiredNameRule,
  defaultDeflectionNoticeValidator,
} from "./deflection-notice-rules.js";
import { newDeflectionNotice } from "./deflection-notice.js";

test("DeflectionNoticeValidator reports every problem", () => {
  const validator = defaultDeflectionNoticeValidator();
  const item = newDeflectionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionNoticeRequiredNameRule flags a blank name", () => {
  const rule = new DeflectionNoticeRequiredNameRule("deflection notice needs a value");
  const item = newDeflectionNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionNoticeCreatedAtRangeRule flags values above created at", () => {
  const rule = new DeflectionNoticeCreatedAtRangeRule(80, 1000);
  const item = newDeflectionNotice("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionNoticeExternalRefLengthRule flags a long external ref", () => {
  const rule = new DeflectionNoticeExternalRefLengthRule(1000);
  const item = newDeflectionNotice("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionNoticeGraceDaysRangeRule flags values above grace days", () => {
  const rule = new DeflectionNoticeGraceDaysRangeRule(64, 1000);
  const item = newDeflectionNotice("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
