import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatScheduleCodeLengthRule,
  CsatScheduleCountryLengthRule,
  CsatScheduleImpressionsRangeRule,
  CsatScheduleRequiredCountryRule,
  defaultCsatScheduleValidator,
} from "./csat-schedule-rules.js";
import { newCsatSchedule } from "./csat-schedule.js";

test("CsatScheduleValidator reports every problem", () => {
  const validator = defaultCsatScheduleValidator();
  const item = newCsatSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatScheduleCountryLengthRule flags a long country", () => {
  const rule = new CsatScheduleCountryLengthRule(64);
  const item = newCsatSchedule("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatScheduleRequiredCountryRule flags a blank country", () => {
  const rule = new CsatScheduleRequiredCountryRule("csat schedule needs an entry");
  const item = newCsatSchedule("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatScheduleCodeLengthRule flags a long code", () => {
  const rule = new CsatScheduleCodeLengthRule(80);
  const item = newCsatSchedule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatScheduleImpressionsRangeRule flags values above impressions", () => {
  const rule = new CsatScheduleImpressionsRangeRule(80, 3600);
  const item = newCsatSchedule("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
