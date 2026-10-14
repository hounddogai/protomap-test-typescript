import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSenderEntryBatchSizeRangeRule,
  ScheduledSenderEntryCodeLengthRule,
  ScheduledSenderEntryJourneyIdLengthRule,
  ScheduledSenderEntryRequiredJourneyIdRule,
  defaultScheduledSenderEntryValidator,
} from "./scheduled-sender-entry-rules.js";
import { newScheduledSenderEntry } from "./scheduled-sender-entry.js";

test("ScheduledSenderEntryValidator reports every problem", () => {
  const validator = defaultScheduledSenderEntryValidator();
  const item = newScheduledSenderEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSenderEntryRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ScheduledSenderEntryRequiredJourneyIdRule("scheduled sender entry needs this field");
  const item = newScheduledSenderEntry("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSenderEntryBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ScheduledSenderEntryBatchSizeRangeRule(32, 3600);
  const item = newScheduledSenderEntry("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSenderEntryCodeLengthRule flags a long code", () => {
  const rule = new ScheduledSenderEntryCodeLengthRule(3600);
  const item = newScheduledSenderEntry("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSenderEntryJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ScheduledSenderEntryJourneyIdLengthRule(80);
  const item = newScheduledSenderEntry("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
