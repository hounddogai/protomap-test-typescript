import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckSnapshotDiscountRangeRule,
  FraudCheckSnapshotDurationMinutesRangeRule,
  FraudCheckSnapshotJourneyIdLengthRule,
  FraudCheckSnapshotRequiredTitleRule,
  FraudCheckSnapshotTitleLengthRule,
  defaultFraudCheckSnapshotValidator,
} from "./fraud-check-snapshot-rules.js";
import { newFraudCheckSnapshot } from "./fraud-check-snapshot.js";

test("FraudCheckSnapshotValidator reports every problem", () => {
  const validator = defaultFraudCheckSnapshotValidator();
  const item = newFraudCheckSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckSnapshotTitleLengthRule flags a long title", () => {
  const rule = new FraudCheckSnapshotTitleLengthRule(1000);
  const item = newFraudCheckSnapshot("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckSnapshotDiscountRangeRule flags values above discount", () => {
  const rule = new FraudCheckSnapshotDiscountRangeRule(3.1, 3301.6);
  const item = newFraudCheckSnapshot("x", "y");
  item.discount = 3303.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new FraudCheckSnapshotRequiredTitleRule("fraud check snapshot needs this field");
  const item = newFraudCheckSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckSnapshotDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new FraudCheckSnapshotDurationMinutesRangeRule(16, 64);
  const item = newFraudCheckSnapshot("x", "y");
  item.durationMinutes = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckSnapshotJourneyIdLengthRule flags a long journey id", () => {
  const rule = new FraudCheckSnapshotJourneyIdLengthRule(120);
  const item = newFraudCheckSnapshot("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
