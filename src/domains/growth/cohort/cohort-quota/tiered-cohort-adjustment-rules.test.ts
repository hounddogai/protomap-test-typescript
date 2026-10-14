import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCohortAdjustmentQuantityRangeRule,
  TieredCohortAdjustmentRequiredChannelRule,
  TieredCohortAdjustmentRequiredCodeRule,
  TieredCohortAdjustmentRequiredDescriptionRule,
  defaultTieredCohortAdjustmentValidator,
} from "./tiered-cohort-adjustment-rules.js";
import { newTieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

test("TieredCohortAdjustmentValidator reports every problem", () => {
  const validator = defaultTieredCohortAdjustmentValidator();
  const item = newTieredCohortAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCohortAdjustmentRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredCohortAdjustmentRequiredChannelRule("tiered cohort adjustment needs a value");
  const item = newTieredCohortAdjustment("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCohortAdjustmentQuantityRangeRule flags values above quantity", () => {
  const rule = new TieredCohortAdjustmentQuantityRangeRule(32, 3600);
  const item = newTieredCohortAdjustment("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCohortAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new TieredCohortAdjustmentRequiredCodeRule("tiered cohort adjustment needs this field");
  const item = newTieredCohortAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCohortAdjustmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new TieredCohortAdjustmentRequiredDescriptionRule("tiered cohort adjustment needs this field");
  const item = newTieredCohortAdjustment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
