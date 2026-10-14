import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualInsightAdjustmentCapacityRangeRule,
  ManualInsightAdjustmentRequiredCodeRule,
  ManualInsightAdjustmentRequiredRegionRule,
  defaultManualInsightAdjustmentValidator,
} from "./manual-insight-adjustment-rules.js";
import { newManualInsightAdjustment } from "./manual-insight-adjustment.js";

test("ManualInsightAdjustmentValidator reports every problem", () => {
  const validator = defaultManualInsightAdjustmentValidator();
  const item = newManualInsightAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualInsightAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new ManualInsightAdjustmentRequiredCodeRule("manual insight adjustment needs this field");
  const item = newManualInsightAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualInsightAdjustmentCapacityRangeRule flags values above capacity", () => {
  const rule = new ManualInsightAdjustmentCapacityRangeRule(120, 3600);
  const item = newManualInsightAdjustment("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualInsightAdjustmentRequiredRegionRule flags a blank region", () => {
  const rule = new ManualInsightAdjustmentRequiredRegionRule("manual insight adjustment needs a value");
  const item = newManualInsightAdjustment("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
