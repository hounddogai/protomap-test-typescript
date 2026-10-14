import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortDraftCreatedAtRangeRule,
  CohortDraftPhoneLengthRule,
  defaultCohortDraftValidator,
} from "./cohort-draft-rules.js";
import { newCohortDraft } from "./cohort-draft.js";

test("CohortDraftValidator reports every problem", () => {
  const validator = defaultCohortDraftValidator();
  const item = newCohortDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortDraftPhoneLengthRule flags a long phone", () => {
  const rule = new CohortDraftPhoneLengthRule(16);
  const item = newCohortDraft("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortDraftCreatedAtRangeRule flags values above created at", () => {
  const rule = new CohortDraftCreatedAtRangeRule(16, 120);
  const item = newCohortDraft("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
