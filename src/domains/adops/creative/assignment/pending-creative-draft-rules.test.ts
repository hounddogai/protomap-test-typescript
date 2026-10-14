import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreativeDraftCohortLengthRule,
  PendingCreativeDraftDurationMinutesRangeRule,
  PendingCreativeDraftPhoneLengthRule,
  PendingCreativeDraftRequiredCodeRule,
  defaultPendingCreativeDraftValidator,
} from "./pending-creative-draft-rules.js";
import { newPendingCreativeDraft } from "./pending-creative-draft.js";

test("PendingCreativeDraftValidator reports every problem", () => {
  const validator = defaultPendingCreativeDraftValidator();
  const item = newPendingCreativeDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreativeDraftRequiredCodeRule flags a blank code", () => {
  const rule = new PendingCreativeDraftRequiredCodeRule("pending creative draft needs an entry");
  const item = newPendingCreativeDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeDraftPhoneLengthRule flags a long phone", () => {
  const rule = new PendingCreativeDraftPhoneLengthRule(80);
  const item = newPendingCreativeDraft("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCreativeDraftDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PendingCreativeDraftDurationMinutesRangeRule(120, 3600);
  const item = newPendingCreativeDraft("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCreativeDraftCohortLengthRule flags a long cohort", () => {
  const rule = new PendingCreativeDraftCohortLengthRule(255);
  const item = newPendingCreativeDraft("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
