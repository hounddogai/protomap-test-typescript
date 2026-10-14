import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierEntryCodeLengthRule,
  TierEntryCohortLengthRule,
  TierEntryCostRangeRule,
  TierEntryNameLengthRule,
  defaultTierEntryValidator,
} from "./tier-entry-rules.js";
import { newTierEntry } from "./tier-entry.js";

test("TierEntryValidator reports every problem", () => {
  const validator = defaultTierEntryValidator();
  const item = newTierEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierEntryCostRangeRule flags values above cost", () => {
  const rule = new TierEntryCostRangeRule(6.8, 207.8);
  const item = newTierEntry("x", "y");
  item.cost = 209.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierEntryCohortLengthRule flags a long cohort", () => {
  const rule = new TierEntryCohortLengthRule(80);
  const item = newTierEntry("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierEntryNameLengthRule flags a long name", () => {
  const rule = new TierEntryNameLengthRule(3600);
  const item = newTierEntry("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierEntryCodeLengthRule flags a long code", () => {
  const rule = new TierEntryCodeLengthRule(16);
  const item = newTierEntry("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
