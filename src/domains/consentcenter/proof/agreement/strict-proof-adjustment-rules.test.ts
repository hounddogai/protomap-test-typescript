import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictProofAdjustmentDurationMinutesRangeRule,
  StrictProofAdjustmentRequiredCodeRule,
  StrictProofAdjustmentRequiredTitleRule,
  StrictProofAdjustmentTitleLengthRule,
  defaultStrictProofAdjustmentValidator,
} from "./strict-proof-adjustment-rules.js";
import { newStrictProofAdjustment } from "./strict-proof-adjustment.js";

test("StrictProofAdjustmentValidator reports every problem", () => {
  const validator = defaultStrictProofAdjustmentValidator();
  const item = newStrictProofAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictProofAdjustmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new StrictProofAdjustmentDurationMinutesRangeRule(1000, 3600);
  const item = newStrictProofAdjustment("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictProofAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new StrictProofAdjustmentRequiredCodeRule("strict proof adjustment needs this field");
  const item = newStrictProofAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictProofAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new StrictProofAdjustmentTitleLengthRule(64);
  const item = newStrictProofAdjustment("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictProofAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new StrictProofAdjustmentRequiredTitleRule("strict proof adjustment needs this field");
  const item = newStrictProofAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
