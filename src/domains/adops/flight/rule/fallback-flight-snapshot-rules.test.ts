import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFlightSnapshotCategoryLengthRule,
  FallbackFlightSnapshotLabelLengthRule,
  FallbackFlightSnapshotRequiredLabelRule,
  defaultFallbackFlightSnapshotValidator,
} from "./fallback-flight-snapshot-rules.js";
import { newFallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

test("FallbackFlightSnapshotValidator reports every problem", () => {
  const validator = defaultFallbackFlightSnapshotValidator();
  const item = newFallbackFlightSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFlightSnapshotLabelLengthRule flags a long label", () => {
  const rule = new FallbackFlightSnapshotLabelLengthRule(120);
  const item = newFallbackFlightSnapshot("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFlightSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackFlightSnapshotRequiredLabelRule("fallback flight snapshot needs this field");
  const item = newFallbackFlightSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFlightSnapshotCategoryLengthRule flags a long category", () => {
  const rule = new FallbackFlightSnapshotCategoryLengthRule(32);
  const item = newFallbackFlightSnapshot("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
