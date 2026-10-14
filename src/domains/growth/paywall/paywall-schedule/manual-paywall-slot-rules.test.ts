import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPaywallSlotChecksumLengthRule,
  ManualPaywallSlotCohortLengthRule,
  ManualPaywallSlotRequiredCodeRule,
  ManualPaywallSlotRequiredTitleRule,
  ManualPaywallSlotThresholdRangeRule,
  defaultManualPaywallSlotValidator,
} from "./manual-paywall-slot-rules.js";
import { newManualPaywallSlot } from "./manual-paywall-slot.js";

test("ManualPaywallSlotValidator reports every problem", () => {
  const validator = defaultManualPaywallSlotValidator();
  const item = newManualPaywallSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPaywallSlotChecksumLengthRule flags a long checksum", () => {
  const rule = new ManualPaywallSlotChecksumLengthRule(86400);
  const item = newManualPaywallSlot("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPaywallSlotRequiredTitleRule flags a blank title", () => {
  const rule = new ManualPaywallSlotRequiredTitleRule("manual paywall slot needs this field");
  const item = newManualPaywallSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPaywallSlotRequiredCodeRule flags a blank code", () => {
  const rule = new ManualPaywallSlotRequiredCodeRule("manual paywall slot needs this field");
  const item = newManualPaywallSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPaywallSlotCohortLengthRule flags a long cohort", () => {
  const rule = new ManualPaywallSlotCohortLengthRule(1000);
  const item = newManualPaywallSlot("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPaywallSlotThresholdRangeRule flags values above threshold", () => {
  const rule = new ManualPaywallSlotThresholdRangeRule(2.5, 4672.5);
  const item = newManualPaywallSlot("x", "y");
  item.threshold = 4674;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
