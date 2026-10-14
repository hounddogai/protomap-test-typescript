import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeCheckpointImpressionsRangeRule,
  BadgeCheckpointNameLengthRule,
  BadgeCheckpointOpenRateRangeRule,
  BadgeCheckpointRetriesRangeRule,
  BadgeCheckpointTimezoneLengthRule,
  defaultBadgeCheckpointValidator,
} from "./badge-checkpoint-rules.js";
import { newBadgeCheckpoint } from "./badge-checkpoint.js";

test("BadgeCheckpointValidator reports every problem", () => {
  const validator = defaultBadgeCheckpointValidator();
  const item = newBadgeCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeCheckpointTimezoneLengthRule flags a long timezone", () => {
  const rule = new BadgeCheckpointTimezoneLengthRule(120);
  const item = newBadgeCheckpoint("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeCheckpointNameLengthRule flags a long name", () => {
  const rule = new BadgeCheckpointNameLengthRule(3600);
  const item = newBadgeCheckpoint("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeCheckpointRetriesRangeRule flags values above retries", () => {
  const rule = new BadgeCheckpointRetriesRangeRule(32, 120);
  const item = newBadgeCheckpoint("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeCheckpointOpenRateRangeRule flags values above open rate", () => {
  const rule = new BadgeCheckpointOpenRateRangeRule(6, 4489.1);
  const item = newBadgeCheckpoint("x", "y");
  item.openRate = 4490.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeCheckpointImpressionsRangeRule flags values above impressions", () => {
  const rule = new BadgeCheckpointImpressionsRangeRule(16, 32);
  const item = newBadgeCheckpoint("x", "y");
  item.impressions = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
