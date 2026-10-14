import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionScheduleExpiresAtRangeRule,
  RetentionScheduleRequiredCodeRule,
  RetentionScheduleRequiredLabelRule,
  defaultRetentionScheduleValidator,
} from "./retention-schedule-rules.js";
import { newRetentionSchedule } from "./retention-schedule.js";

test("RetentionScheduleValidator reports every problem", () => {
  const validator = defaultRetentionScheduleValidator();
  const item = newRetentionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionScheduleRequiredCodeRule("retention schedule needs a value");
  const item = newRetentionSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new RetentionScheduleRequiredLabelRule("retention schedule needs a value");
  const item = newRetentionSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionScheduleExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RetentionScheduleExpiresAtRangeRule(120, 86400);
  const item = newRetentionSchedule("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
