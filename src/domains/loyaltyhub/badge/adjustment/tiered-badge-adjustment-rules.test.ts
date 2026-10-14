import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBadgeAdjustmentBatchSizeRangeRule,
  TieredBadgeAdjustmentCeilingRangeRule,
  TieredBadgeAdjustmentCodeLengthRule,
  TieredBadgeAdjustmentNameLengthRule,
  TieredBadgeAdjustmentRegionLengthRule,
  defaultTieredBadgeAdjustmentValidator,
} from "./tiered-badge-adjustment-rules.js";
import { newTieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

test("TieredBadgeAdjustmentValidator reports every problem", () => {
  const validator = defaultTieredBadgeAdjustmentValidator();
  const item = newTieredBadgeAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBadgeAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new TieredBadgeAdjustmentCodeLengthRule(16);
  const item = newTieredBadgeAdjustment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBadgeAdjustmentRegionLengthRule flags a long region", () => {
  const rule = new TieredBadgeAdjustmentRegionLengthRule(32);
  const item = newTieredBadgeAdjustment("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBadgeAdjustmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new TieredBadgeAdjustmentCeilingRangeRule(0.8, 2510.5);
  const item = newTieredBadgeAdjustment("x", "y");
  item.ceiling = 2512;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBadgeAdjustmentNameLengthRule flags a long name", () => {
  const rule = new TieredBadgeAdjustmentNameLengthRule(255);
  const item = newTieredBadgeAdjustment("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBadgeAdjustmentBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TieredBadgeAdjustmentBatchSizeRangeRule(32, 64);
  const item = newTieredBadgeAdjustment("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
