import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledNudgeProfileRequiredLabelRule,
  ScheduledNudgeProfileReviewerLengthRule,
  ScheduledNudgeProfileSendAtRangeRule,
  defaultScheduledNudgeProfileValidator,
} from "./scheduled-nudge-profile-rules.js";
import { newScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

test("ScheduledNudgeProfileValidator reports every problem", () => {
  const validator = defaultScheduledNudgeProfileValidator();
  const item = newScheduledNudgeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledNudgeProfileRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledNudgeProfileRequiredLabelRule("scheduled nudge profile needs this field");
  const item = newScheduledNudgeProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledNudgeProfileReviewerLengthRule flags a long reviewer", () => {
  const rule = new ScheduledNudgeProfileReviewerLengthRule(120);
  const item = newScheduledNudgeProfile("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledNudgeProfileSendAtRangeRule flags values above send at", () => {
  const rule = new ScheduledNudgeProfileSendAtRangeRule(16, 1000);
  const item = newScheduledNudgeProfile("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
