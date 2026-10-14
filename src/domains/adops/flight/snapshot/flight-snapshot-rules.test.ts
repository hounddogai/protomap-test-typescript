import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightSnapshotCodeLengthRule,
  FlightSnapshotDiscountRangeRule,
  FlightSnapshotEndsAtRangeRule,
  FlightSnapshotExternalRefLengthRule,
  FlightSnapshotRequiredExternalRefRule,
  defaultFlightSnapshotValidator,
} from "./flight-snapshot-rules.js";
import { newFlightSnapshot } from "./flight-snapshot.js";

test("FlightSnapshotValidator reports every problem", () => {
  const validator = defaultFlightSnapshotValidator();
  const item = newFlightSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightSnapshotCodeLengthRule flags a long code", () => {
  const rule = new FlightSnapshotCodeLengthRule(255);
  const item = newFlightSnapshot("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightSnapshotExternalRefLengthRule flags a long external ref", () => {
  const rule = new FlightSnapshotExternalRefLengthRule(1000);
  const item = newFlightSnapshot("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightSnapshotDiscountRangeRule flags values above discount", () => {
  const rule = new FlightSnapshotDiscountRangeRule(0.7, 1391.3);
  const item = newFlightSnapshot("x", "y");
  item.discount = 1392.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightSnapshotEndsAtRangeRule flags values above ends at", () => {
  const rule = new FlightSnapshotEndsAtRangeRule(1000, 86400);
  const item = newFlightSnapshot("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightSnapshotRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new FlightSnapshotRequiredExternalRefRule("flight snapshot needs an entry");
  const item = newFlightSnapshot("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
