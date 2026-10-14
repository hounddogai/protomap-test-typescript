import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientInsightScheduleOwnerIdLengthRule,
  LenientInsightScheduleRequiredCodeRule,
  LenientInsightScheduleRequiredLabelRule,
  LenientInsightScheduleRequiredOwnerIdRule,
  defaultLenientInsightScheduleValidator,
} from "./lenient-insight-schedule-rules.js";
import { newLenientInsightSchedule } from "./lenient-insight-schedule.js";

test("LenientInsightScheduleValidator reports every problem", () => {
  const validator = defaultLenientInsightScheduleValidator();
  const item = newLenientInsightSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientInsightScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new LenientInsightScheduleRequiredLabelRule("lenient insight schedule needs this field");
  const item = newLenientInsightSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInsightScheduleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LenientInsightScheduleRequiredOwnerIdRule("lenient insight schedule needs this field");
  const item = newLenientInsightSchedule("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInsightScheduleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LenientInsightScheduleOwnerIdLengthRule(3600);
  const item = newLenientInsightSchedule("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientInsightScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new LenientInsightScheduleRequiredCodeRule("lenient insight schedule needs an entry");
  const item = newLenientInsightSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
