import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalApprovalScheduleLabelLengthRule,
  SeasonalApprovalScheduleRequiredCodeRule,
  SeasonalApprovalScheduleRequiredLocaleRule,
  SeasonalApprovalScheduleRequiredOwnerIdRule,
  defaultSeasonalApprovalScheduleValidator,
} from "./seasonal-approval-schedule-rules.js";
import { newSeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

test("SeasonalApprovalScheduleValidator reports every problem", () => {
  const validator = defaultSeasonalApprovalScheduleValidator();
  const item = newSeasonalApprovalSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalApprovalScheduleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SeasonalApprovalScheduleRequiredOwnerIdRule("seasonal approval schedule needs a value");
  const item = newSeasonalApprovalSchedule("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalApprovalScheduleRequiredLocaleRule flags a blank locale", () => {
  const rule = new SeasonalApprovalScheduleRequiredLocaleRule("seasonal approval schedule needs a value");
  const item = newSeasonalApprovalSchedule("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalApprovalScheduleLabelLengthRule flags a long label", () => {
  const rule = new SeasonalApprovalScheduleLabelLengthRule(120);
  const item = newSeasonalApprovalSchedule("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalApprovalScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalApprovalScheduleRequiredCodeRule("seasonal approval schedule needs this field");
  const item = newSeasonalApprovalSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
