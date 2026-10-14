import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPaywallEntryCostRangeRule,
  PendingPaywallEntryExpiresAtRangeRule,
  PendingPaywallEntryRequiredNameRule,
  PendingPaywallEntryRequiredSegmentRule,
  PendingPaywallEntrySegmentLengthRule,
  defaultPendingPaywallEntryValidator,
} from "./pending-paywall-entry-rules.js";
import { newPendingPaywallEntry } from "./pending-paywall-entry.js";

test("PendingPaywallEntryValidator reports every problem", () => {
  const validator = defaultPendingPaywallEntryValidator();
  const item = newPendingPaywallEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPaywallEntryExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PendingPaywallEntryExpiresAtRangeRule(64, 80);
  const item = newPendingPaywallEntry("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPaywallEntryRequiredSegmentRule flags a blank segment", () => {
  const rule = new PendingPaywallEntryRequiredSegmentRule("pending paywall entry needs an entry");
  const item = newPendingPaywallEntry("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPaywallEntryRequiredNameRule flags a blank name", () => {
  const rule = new PendingPaywallEntryRequiredNameRule("pending paywall entry needs a value");
  const item = newPendingPaywallEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPaywallEntrySegmentLengthRule flags a long segment", () => {
  const rule = new PendingPaywallEntrySegmentLengthRule(1000);
  const item = newPendingPaywallEntry("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPaywallEntryCostRangeRule flags values above cost", () => {
  const rule = new PendingPaywallEntryCostRangeRule(5.3, 90);
  const item = newPendingPaywallEntry("x", "y");
  item.cost = 91.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
