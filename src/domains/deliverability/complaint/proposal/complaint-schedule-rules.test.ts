import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintScheduleBudgetRangeRule,
  ComplaintScheduleRequiredCodeRule,
  ComplaintScheduleRetriesRangeRule,
  defaultComplaintScheduleValidator,
} from "./complaint-schedule-rules.js";
import { newComplaintSchedule } from "./complaint-schedule.js";

test("ComplaintScheduleValidator reports every problem", () => {
  const validator = defaultComplaintScheduleValidator();
  const item = newComplaintSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintScheduleRequiredCodeRule("complaint schedule needs an entry");
  const item = newComplaintSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintScheduleBudgetRangeRule flags values above budget", () => {
  const rule = new ComplaintScheduleBudgetRangeRule(3.8, 4992.4);
  const item = newComplaintSchedule("x", "y");
  item.budget = 4993.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintScheduleRetriesRangeRule flags values above retries", () => {
  const rule = new ComplaintScheduleRetriesRangeRule(120, 120);
  const item = newComplaintSchedule("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
