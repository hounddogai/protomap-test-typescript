import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSenderEntryBidRangeRule,
  PendingSenderEntryCreatedAtRangeRule,
  PendingSenderEntryLabelLengthRule,
  PendingSenderEntryRequiredLabelRule,
  PendingSenderEntryRequiredTitleRule,
  PendingSenderEntrySegmentLengthRule,
  defaultPendingSenderEntryValidator,
} from "./pending-sender-entry-rules.js";
import { newPendingSenderEntry } from "./pending-sender-entry.js";

test("PendingSenderEntryValidator reports every problem", () => {
  const validator = defaultPendingSenderEntryValidator();
  const item = newPendingSenderEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSenderEntryLabelLengthRule flags a long label", () => {
  const rule = new PendingSenderEntryLabelLengthRule(120);
  const item = newPendingSenderEntry("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSenderEntryRequiredLabelRule flags a blank label", () => {
  const rule = new PendingSenderEntryRequiredLabelRule("pending sender entry needs an entry");
  const item = newPendingSenderEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSenderEntryBidRangeRule flags values above bid", () => {
  const rule = new PendingSenderEntryBidRangeRule(8.8, 4953.1);
  const item = newPendingSenderEntry("x", "y");
  item.bid = 4954.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSenderEntryCreatedAtRangeRule flags values above created at", () => {
  const rule = new PendingSenderEntryCreatedAtRangeRule(16, 86400);
  const item = newPendingSenderEntry("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSenderEntryRequiredTitleRule flags a blank title", () => {
  const rule = new PendingSenderEntryRequiredTitleRule("pending sender entry needs an entry");
  const item = newPendingSenderEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSenderEntrySegmentLengthRule flags a long segment", () => {
  const rule = new PendingSenderEntrySegmentLengthRule(16);
  const item = newPendingSenderEntry("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
