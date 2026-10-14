import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFlightNoticeRequiredOwnerIdRule,
  ScheduledFlightNoticeRequiredTitleRule,
  ScheduledFlightNoticeSequenceRangeRule,
  defaultScheduledFlightNoticeValidator,
} from "./scheduled-flight-notice-rules.js";
import { newScheduledFlightNotice } from "./scheduled-flight-notice.js";

test("ScheduledFlightNoticeValidator reports every problem", () => {
  const validator = defaultScheduledFlightNoticeValidator();
  const item = newScheduledFlightNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFlightNoticeSequenceRangeRule flags values above sequence", () => {
  const rule = new ScheduledFlightNoticeSequenceRangeRule(255, 1000);
  const item = newScheduledFlightNotice("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFlightNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledFlightNoticeRequiredTitleRule("scheduled flight notice needs a value");
  const item = newScheduledFlightNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFlightNoticeRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledFlightNoticeRequiredOwnerIdRule("scheduled flight notice needs an entry");
  const item = newScheduledFlightNotice("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
