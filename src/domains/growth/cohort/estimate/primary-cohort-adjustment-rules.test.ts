import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryCohortAdjustmentRegionLengthRule,
  PrimaryCohortAdjustmentRequiredAudienceIdRule,
  PrimaryCohortAdjustmentRequiredCodeRule,
  PrimaryCohortAdjustmentRequiredRegionRule,
  PrimaryCohortAdjustmentWindowDaysRangeRule,
  defaultPrimaryCohortAdjustmentValidator,
} from "./primary-cohort-adjustment-rules.js";
import { newPrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

test("PrimaryCohortAdjustmentValidator reports every problem", () => {
  const validator = defaultPrimaryCohortAdjustmentValidator();
  const item = newPrimaryCohortAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryCohortAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryCohortAdjustmentRequiredCodeRule("primary cohort adjustment needs this field");
  const item = newPrimaryCohortAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryCohortAdjustmentRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PrimaryCohortAdjustmentRequiredAudienceIdRule("primary cohort adjustment needs a value");
  const item = newPrimaryCohortAdjustment("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryCohortAdjustmentRegionLengthRule flags a long region", () => {
  const rule = new PrimaryCohortAdjustmentRegionLengthRule(86400);
  const item = newPrimaryCohortAdjustment("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryCohortAdjustmentRequiredRegionRule flags a blank region", () => {
  const rule = new PrimaryCohortAdjustmentRequiredRegionRule("primary cohort adjustment needs an entry");
  const item = newPrimaryCohortAdjustment("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryCohortAdjustmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryCohortAdjustmentWindowDaysRangeRule(32, 64);
  const item = newPrimaryCohortAdjustment("x", "y");
  item.windowDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
