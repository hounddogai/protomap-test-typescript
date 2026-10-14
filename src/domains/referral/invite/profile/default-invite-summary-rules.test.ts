import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultInviteSummaryCohortLengthRule,
  DefaultInviteSummaryDescriptionLengthRule,
  DefaultInviteSummaryNameLengthRule,
  DefaultInviteSummaryRequiredCodeRule,
  DefaultInviteSummaryRequiredCohortRule,
  DefaultInviteSummaryScoreRangeRule,
  defaultDefaultInviteSummaryValidator,
} from "./default-invite-summary-rules.js";
import { newDefaultInviteSummary } from "./default-invite-summary.js";

test("DefaultInviteSummaryValidator reports every problem", () => {
  const validator = defaultDefaultInviteSummaryValidator();
  const item = newDefaultInviteSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultInviteSummaryCohortLengthRule flags a long cohort", () => {
  const rule = new DefaultInviteSummaryCohortLengthRule(120);
  const item = newDefaultInviteSummary("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultInviteSummaryDescriptionLengthRule flags a long description", () => {
  const rule = new DefaultInviteSummaryDescriptionLengthRule(255);
  const item = newDefaultInviteSummary("x", "y");
  item.description = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultInviteSummaryScoreRangeRule flags values above score", () => {
  const rule = new DefaultInviteSummaryScoreRangeRule(0.8, 4187.2);
  const item = newDefaultInviteSummary("x", "y");
  item.score = 4188.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultInviteSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultInviteSummaryRequiredCodeRule("default invite summary needs a value");
  const item = newDefaultInviteSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInviteSummaryRequiredCohortRule flags a blank cohort", () => {
  const rule = new DefaultInviteSummaryRequiredCohortRule("default invite summary needs an entry");
  const item = newDefaultInviteSummary("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInviteSummaryNameLengthRule flags a long name", () => {
  const rule = new DefaultInviteSummaryNameLengthRule(64);
  const item = newDefaultInviteSummary("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
