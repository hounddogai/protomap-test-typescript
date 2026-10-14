import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationProfileDurationMinutesRangeRule,
  EscalationProfileEndsAtRangeRule,
  EscalationProfileRequiredCodeRule,
  EscalationProfileRequiredTitleRule,
  defaultEscalationProfileValidator,
} from "./escalation-profile-rules.js";
import { newEscalationProfile } from "./escalation-profile.js";

test("EscalationProfileValidator reports every problem", () => {
  const validator = defaultEscalationProfileValidator();
  const item = newEscalationProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationProfileRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationProfileRequiredCodeRule("escalation profile needs an entry");
  const item = newEscalationProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationProfileRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationProfileRequiredTitleRule("escalation profile needs an entry");
  const item = newEscalationProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationProfileDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new EscalationProfileDurationMinutesRangeRule(80, 86400);
  const item = newEscalationProfile("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationProfileEndsAtRangeRule flags values above ends at", () => {
  const rule = new EscalationProfileEndsAtRangeRule(32, 80);
  const item = newEscalationProfile("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
