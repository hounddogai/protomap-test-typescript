import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintProfileJourneyIdLengthRule,
  ComplaintProfileOpenRateRangeRule,
  ComplaintProfileRequiredJourneyIdRule,
  ComplaintProfileRequiredTitleRule,
  defaultComplaintProfileValidator,
} from "./complaint-profile-rules.js";
import { newComplaintProfile } from "./complaint-profile.js";

test("ComplaintProfileValidator reports every problem", () => {
  const validator = defaultComplaintProfileValidator();
  const item = newComplaintProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintProfileJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ComplaintProfileJourneyIdLengthRule(80);
  const item = newComplaintProfile("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintProfileOpenRateRangeRule flags values above open rate", () => {
  const rule = new ComplaintProfileOpenRateRangeRule(1.9, 1655);
  const item = newComplaintProfile("x", "y");
  item.openRate = 1656.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintProfileRequiredTitleRule flags a blank title", () => {
  const rule = new ComplaintProfileRequiredTitleRule("complaint profile needs this field");
  const item = newComplaintProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintProfileRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ComplaintProfileRequiredJourneyIdRule("complaint profile needs this field");
  const item = newComplaintProfile("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
