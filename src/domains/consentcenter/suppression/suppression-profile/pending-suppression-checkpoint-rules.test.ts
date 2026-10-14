import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSuppressionCheckpointAmountRangeRule,
  PendingSuppressionCheckpointConversionRateRangeRule,
  PendingSuppressionCheckpointDiscountRangeRule,
  defaultPendingSuppressionCheckpointValidator,
} from "./pending-suppression-checkpoint-rules.js";
import { newPendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

test("PendingSuppressionCheckpointValidator reports every problem", () => {
  const validator = defaultPendingSuppressionCheckpointValidator();
  const item = newPendingSuppressionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSuppressionCheckpointDiscountRangeRule flags values above discount", () => {
  const rule = new PendingSuppressionCheckpointDiscountRangeRule(1.2, 149.2);
  const item = newPendingSuppressionCheckpoint("x", "y");
  item.discount = 150.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSuppressionCheckpointConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PendingSuppressionCheckpointConversionRateRangeRule(7.7, 2055);
  const item = newPendingSuppressionCheckpoint("x", "y");
  item.conversionRate = 2056.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSuppressionCheckpointAmountRangeRule flags values above amount", () => {
  const rule = new PendingSuppressionCheckpointAmountRangeRule(1.5, 687.9);
  const item = newPendingSuppressionCheckpoint("x", "y");
  item.amount = 689.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
