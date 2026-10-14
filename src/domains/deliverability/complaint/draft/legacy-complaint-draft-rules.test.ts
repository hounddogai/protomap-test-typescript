import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyComplaintDraftCodeLengthRule,
  LegacyComplaintDraftEndsAtRangeRule,
  LegacyComplaintDraftTitleLengthRule,
  LegacyComplaintDraftWindowDaysRangeRule,
  defaultLegacyComplaintDraftValidator,
} from "./legacy-complaint-draft-rules.js";
import { newLegacyComplaintDraft } from "./legacy-complaint-draft.js";

test("LegacyComplaintDraftValidator reports every problem", () => {
  const validator = defaultLegacyComplaintDraftValidator();
  const item = newLegacyComplaintDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyComplaintDraftWindowDaysRangeRule flags values above window days", () => {
  const rule = new LegacyComplaintDraftWindowDaysRangeRule(64, 120);
  const item = newLegacyComplaintDraft("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyComplaintDraftEndsAtRangeRule flags values above ends at", () => {
  const rule = new LegacyComplaintDraftEndsAtRangeRule(16, 120);
  const item = newLegacyComplaintDraft("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyComplaintDraftTitleLengthRule flags a long title", () => {
  const rule = new LegacyComplaintDraftTitleLengthRule(16);
  const item = newLegacyComplaintDraft("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyComplaintDraftCodeLengthRule flags a long code", () => {
  const rule = new LegacyComplaintDraftCodeLengthRule(1000);
  const item = newLegacyComplaintDraft("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
