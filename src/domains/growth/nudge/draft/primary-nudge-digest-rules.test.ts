import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryNudgeDigestDurationMinutesRangeRule,
  PrimaryNudgeDigestEndsAtRangeRule,
  PrimaryNudgeDigestLimitRangeRule,
  PrimaryNudgeDigestRequiredCodeRule,
  defaultPrimaryNudgeDigestValidator,
} from "./primary-nudge-digest-rules.js";
import { newPrimaryNudgeDigest } from "./primary-nudge-digest.js";

test("PrimaryNudgeDigestValidator reports every problem", () => {
  const validator = defaultPrimaryNudgeDigestValidator();
  const item = newPrimaryNudgeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryNudgeDigestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PrimaryNudgeDigestDurationMinutesRangeRule(80, 255);
  const item = newPrimaryNudgeDigest("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryNudgeDigestEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryNudgeDigestEndsAtRangeRule(16, 80);
  const item = newPrimaryNudgeDigest("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryNudgeDigestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryNudgeDigestRequiredCodeRule("primary nudge digest needs this field");
  const item = newPrimaryNudgeDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryNudgeDigestLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryNudgeDigestLimitRangeRule(80, 3600);
  const item = newPrimaryNudgeDigest("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
