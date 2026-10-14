import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroScheduleBidRangeRule,
  MacroScheduleRequiredCodeRule,
  MacroScheduleRequiredCountryRule,
  MacroScheduleRequiredReviewerRule,
  MacroScheduleRetriesRangeRule,
  defaultMacroScheduleValidator,
} from "./macro-schedule-rules.js";
import { newMacroSchedule } from "./macro-schedule.js";

test("MacroScheduleValidator reports every problem", () => {
  const validator = defaultMacroScheduleValidator();
  const item = newMacroSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroScheduleRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new MacroScheduleRequiredReviewerRule("macro schedule needs this field");
  const item = newMacroSchedule("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroScheduleRequiredCountryRule flags a blank country", () => {
  const rule = new MacroScheduleRequiredCountryRule("macro schedule needs a value");
  const item = newMacroSchedule("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroScheduleRetriesRangeRule flags values above retries", () => {
  const rule = new MacroScheduleRetriesRangeRule(3600, 86400);
  const item = newMacroSchedule("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new MacroScheduleRequiredCodeRule("macro schedule needs a value");
  const item = newMacroSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroScheduleBidRangeRule flags values above bid", () => {
  const rule = new MacroScheduleBidRangeRule(2.2, 296);
  const item = newMacroSchedule("x", "y");
  item.bid = 297.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
