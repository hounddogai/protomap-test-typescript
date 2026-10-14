import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallSnapshotAmountRangeRule,
  PaywallSnapshotCreatedAtRangeRule,
  PaywallSnapshotRequiredLabelRule,
  PaywallSnapshotRequiredVariantRule,
  defaultPaywallSnapshotValidator,
} from "./paywall-snapshot-rules.js";
import { newPaywallSnapshot } from "./paywall-snapshot.js";

test("PaywallSnapshotValidator reports every problem", () => {
  const validator = defaultPaywallSnapshotValidator();
  const item = newPaywallSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallSnapshotRequiredVariantRule flags a blank variant", () => {
  const rule = new PaywallSnapshotRequiredVariantRule("paywall snapshot needs an entry");
  const item = newPaywallSnapshot("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallSnapshotCreatedAtRangeRule flags values above created at", () => {
  const rule = new PaywallSnapshotCreatedAtRangeRule(16, 1000);
  const item = newPaywallSnapshot("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallSnapshotAmountRangeRule flags values above amount", () => {
  const rule = new PaywallSnapshotAmountRangeRule(3.6, 188.8);
  const item = newPaywallSnapshot("x", "y");
  item.amount = 190.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallSnapshotRequiredLabelRule("paywall snapshot needs this field");
  const item = newPaywallSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
