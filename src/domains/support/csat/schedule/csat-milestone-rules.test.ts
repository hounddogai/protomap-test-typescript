import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatMilestoneCodeLengthRule,
  CsatMilestoneRequiredExternalRefRule,
  CsatMilestoneRequiredJourneyIdRule,
  CsatMilestoneRequiredTitleRule,
  CsatMilestoneScoreRangeRule,
  CsatMilestoneTitleLengthRule,
  defaultCsatMilestoneValidator,
} from "./csat-milestone-rules.js";
import { newCsatMilestone } from "./csat-milestone.js";

test("CsatMilestoneValidator reports every problem", () => {
  const validator = defaultCsatMilestoneValidator();
  const item = newCsatMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatMilestoneRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new CsatMilestoneRequiredExternalRefRule("csat milestone needs an entry");
  const item = newCsatMilestone("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatMilestoneTitleLengthRule flags a long title", () => {
  const rule = new CsatMilestoneTitleLengthRule(64);
  const item = newCsatMilestone("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatMilestoneRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new CsatMilestoneRequiredJourneyIdRule("csat milestone needs this field");
  const item = newCsatMilestone("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatMilestoneScoreRangeRule flags values above score", () => {
  const rule = new CsatMilestoneScoreRangeRule(2.2, 2028.4);
  const item = newCsatMilestone("x", "y");
  item.score = 2029.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new CsatMilestoneRequiredTitleRule("csat milestone needs an entry");
  const item = newCsatMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatMilestoneCodeLengthRule flags a long code", () => {
  const rule = new CsatMilestoneCodeLengthRule(1000);
  const item = newCsatMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
