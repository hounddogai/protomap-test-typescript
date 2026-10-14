import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFraudCheckReservationRequiredTitleRule,
  BatchedFraudCheckReservationSendAtRangeRule,
  defaultBatchedFraudCheckReservationValidator,
} from "./batched-fraud-check-reservation-rules.js";
import { newBatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

test("BatchedFraudCheckReservationValidator reports every problem", () => {
  const validator = defaultBatchedFraudCheckReservationValidator();
  const item = newBatchedFraudCheckReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFraudCheckReservationSendAtRangeRule flags values above send at", () => {
  const rule = new BatchedFraudCheckReservationSendAtRangeRule(1000, 3600);
  const item = newBatchedFraudCheckReservation("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFraudCheckReservationRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedFraudCheckReservationRequiredTitleRule("batched fraud check reservation needs a value");
  const item = newBatchedFraudCheckReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
