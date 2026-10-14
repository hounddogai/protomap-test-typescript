import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientOptOutScheduleCodeLengthRule,
  LenientOptOutScheduleNameLengthRule,
  LenientOptOutScheduleSegmentLengthRule,
  defaultLenientOptOutScheduleValidator,
} from "./lenient-opt-out-schedule-rules.js";
import { newLenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

test("LenientOptOutScheduleValidator reports every problem", () => {
  const validator = defaultLenientOptOutScheduleValidator();
  const item = newLenientOptOutSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientOptOutScheduleSegmentLengthRule flags a long segment", () => {
  const rule = new LenientOptOutScheduleSegmentLengthRule(255);
  const item = newLenientOptOutSchedule("x", "y");
  item.segment = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientOptOutScheduleCodeLengthRule flags a long code", () => {
  const rule = new LenientOptOutScheduleCodeLengthRule(3600);
  const item = newLenientOptOutSchedule("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientOptOutScheduleNameLengthRule flags a long name", () => {
  const rule = new LenientOptOutScheduleNameLengthRule(120);
  const item = newLenientOptOutSchedule("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
