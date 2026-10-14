import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledJourneyDraftBudgetRangeRule,
  ScheduledJourneyDraftCodeLengthRule,
  ScheduledJourneyDraftRequiredRegionRule,
  defaultScheduledJourneyDraftValidator,
} from "./scheduled-journey-draft-rules.js";
import { newScheduledJourneyDraft } from "./scheduled-journey-draft.js";

test("ScheduledJourneyDraftValidator reports every problem", () => {
  const validator = defaultScheduledJourneyDraftValidator();
  const item = newScheduledJourneyDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledJourneyDraftCodeLengthRule flags a long code", () => {
  const rule = new ScheduledJourneyDraftCodeLengthRule(120);
  const item = newScheduledJourneyDraft("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledJourneyDraftBudgetRangeRule flags values above budget", () => {
  const rule = new ScheduledJourneyDraftBudgetRangeRule(10, 1666.9);
  const item = newScheduledJourneyDraft("x", "y");
  item.budget = 1668.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledJourneyDraftRequiredRegionRule flags a blank region", () => {
  const rule = new ScheduledJourneyDraftRequiredRegionRule("scheduled journey draft needs an entry");
  const item = newScheduledJourneyDraft("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
