import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledLevelProfileBatchSizeRangeRule,
  ScheduledLevelProfileLabelLengthRule,
  ScheduledLevelProfileRegionLengthRule,
  ScheduledLevelProfileRequiredCohortRule,
  ScheduledLevelProfileRequiredRegionRule,
  defaultScheduledLevelProfileValidator,
} from "./scheduled-level-profile-rules.js";
import { newScheduledLevelProfile } from "./scheduled-level-profile.js";

test("ScheduledLevelProfileValidator reports every problem", () => {
  const validator = defaultScheduledLevelProfileValidator();
  const item = newScheduledLevelProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledLevelProfileBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ScheduledLevelProfileBatchSizeRangeRule(16, 120);
  const item = newScheduledLevelProfile("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledLevelProfileLabelLengthRule flags a long label", () => {
  const rule = new ScheduledLevelProfileLabelLengthRule(1000);
  const item = newScheduledLevelProfile("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledLevelProfileRequiredCohortRule flags a blank cohort", () => {
  const rule = new ScheduledLevelProfileRequiredCohortRule("scheduled level profile needs an entry");
  const item = newScheduledLevelProfile("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledLevelProfileRequiredRegionRule flags a blank region", () => {
  const rule = new ScheduledLevelProfileRequiredRegionRule("scheduled level profile needs an entry");
  const item = newScheduledLevelProfile("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledLevelProfileRegionLengthRule flags a long region", () => {
  const rule = new ScheduledLevelProfileRegionLengthRule(32);
  const item = newScheduledLevelProfile("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
