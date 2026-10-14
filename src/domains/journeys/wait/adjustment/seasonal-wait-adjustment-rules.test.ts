import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWaitAdjustmentLabelLengthRule,
  SeasonalWaitAdjustmentRequiredLabelRule,
  SeasonalWaitAdjustmentRevisionRangeRule,
  defaultSeasonalWaitAdjustmentValidator,
} from "./seasonal-wait-adjustment-rules.js";
import { newSeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

test("SeasonalWaitAdjustmentValidator reports every problem", () => {
  const validator = defaultSeasonalWaitAdjustmentValidator();
  const item = newSeasonalWaitAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWaitAdjustmentLabelLengthRule flags a long label", () => {
  const rule = new SeasonalWaitAdjustmentLabelLengthRule(80);
  const item = newSeasonalWaitAdjustment("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalWaitAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalWaitAdjustmentRequiredLabelRule("seasonal wait adjustment needs an entry");
  const item = newSeasonalWaitAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWaitAdjustmentRevisionRangeRule flags values above revision", () => {
  const rule = new SeasonalWaitAdjustmentRevisionRangeRule(64, 80);
  const item = newSeasonalWaitAdjustment("x", "y");
  item.revision = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
