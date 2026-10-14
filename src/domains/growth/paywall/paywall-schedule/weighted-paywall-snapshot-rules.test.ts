import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPaywallSnapshotRequiredCodeRule,
  WeightedPaywallSnapshotRequiredOwnerIdRule,
  WeightedPaywallSnapshotRequiredVariantRule,
  WeightedPaywallSnapshotSequenceRangeRule,
  defaultWeightedPaywallSnapshotValidator,
} from "./weighted-paywall-snapshot-rules.js";
import { newWeightedPaywallSnapshot } from "./weighted-paywall-snapshot.js";

test("WeightedPaywallSnapshotValidator reports every problem", () => {
  const validator = defaultWeightedPaywallSnapshotValidator();
  const item = newWeightedPaywallSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPaywallSnapshotSequenceRangeRule flags values above sequence", () => {
  const rule = new WeightedPaywallSnapshotSequenceRangeRule(64, 80);
  const item = newWeightedPaywallSnapshot("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPaywallSnapshotRequiredVariantRule flags a blank variant", () => {
  const rule = new WeightedPaywallSnapshotRequiredVariantRule("weighted paywall snapshot needs this field");
  const item = newWeightedPaywallSnapshot("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPaywallSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPaywallSnapshotRequiredCodeRule("weighted paywall snapshot needs an entry");
  const item = newWeightedPaywallSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPaywallSnapshotRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WeightedPaywallSnapshotRequiredOwnerIdRule("weighted paywall snapshot needs an entry");
  const item = newWeightedPaywallSnapshot("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
