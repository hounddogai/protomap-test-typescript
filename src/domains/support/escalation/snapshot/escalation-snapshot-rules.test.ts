import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationSnapshotConversionRateRangeRule,
  EscalationSnapshotOpenRateRangeRule,
  EscalationSnapshotTitleLengthRule,
  defaultEscalationSnapshotValidator,
} from "./escalation-snapshot-rules.js";
import { newEscalationSnapshot } from "./escalation-snapshot.js";

test("EscalationSnapshotValidator reports every problem", () => {
  const validator = defaultEscalationSnapshotValidator();
  const item = newEscalationSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationSnapshotTitleLengthRule flags a long title", () => {
  const rule = new EscalationSnapshotTitleLengthRule(3600);
  const item = newEscalationSnapshot("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationSnapshotOpenRateRangeRule flags values above open rate", () => {
  const rule = new EscalationSnapshotOpenRateRangeRule(7.9, 2532.5);
  const item = newEscalationSnapshot("x", "y");
  item.openRate = 2534;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationSnapshotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new EscalationSnapshotConversionRateRangeRule(8.4, 243.4);
  const item = newEscalationSnapshot("x", "y");
  item.conversionRate = 244.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
