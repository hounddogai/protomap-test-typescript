import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTierSegmentBudgetRangeRule,
  PrimaryTierSegmentCodeLengthRule,
  PrimaryTierSegmentRequiredCodeRule,
  PrimaryTierSegmentRequiredNameRule,
  PrimaryTierSegmentStartsAtRangeRule,
  defaultPrimaryTierSegmentValidator,
} from "./primary-tier-segment-rules.js";
import { newPrimaryTierSegment } from "./primary-tier-segment.js";

test("PrimaryTierSegmentValidator reports every problem", () => {
  const validator = defaultPrimaryTierSegmentValidator();
  const item = newPrimaryTierSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTierSegmentRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryTierSegmentRequiredNameRule("primary tier segment needs this field");
  const item = newPrimaryTierSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTierSegmentBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryTierSegmentBudgetRangeRule(3, 1467.2);
  const item = newPrimaryTierSegment("x", "y");
  item.budget = 1468.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryTierSegmentCodeLengthRule flags a long code", () => {
  const rule = new PrimaryTierSegmentCodeLengthRule(80);
  const item = newPrimaryTierSegment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryTierSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryTierSegmentRequiredCodeRule("primary tier segment needs an entry");
  const item = newPrimaryTierSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTierSegmentStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryTierSegmentStartsAtRangeRule(32, 1000);
  const item = newPrimaryTierSegment("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
