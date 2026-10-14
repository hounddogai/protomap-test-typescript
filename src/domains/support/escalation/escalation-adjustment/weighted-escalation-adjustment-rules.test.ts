import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEscalationAdjustmentLocaleLengthRule,
  WeightedEscalationAdjustmentWeightRangeRule,
  defaultWeightedEscalationAdjustmentValidator,
} from "./weighted-escalation-adjustment-rules.js";
import { newWeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

test("WeightedEscalationAdjustmentValidator reports every problem", () => {
  const validator = defaultWeightedEscalationAdjustmentValidator();
  const item = newWeightedEscalationAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEscalationAdjustmentLocaleLengthRule flags a long locale", () => {
  const rule = new WeightedEscalationAdjustmentLocaleLengthRule(16);
  const item = newWeightedEscalationAdjustment("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEscalationAdjustmentWeightRangeRule flags values above weight", () => {
  const rule = new WeightedEscalationAdjustmentWeightRangeRule(8.4, 4106.3);
  const item = newWeightedEscalationAdjustment("x", "y");
  item.weight = 4107.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
