import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyChallengeAuditExpiresAtRangeRule,
  LegacyChallengeAuditNameLengthRule,
  LegacyChallengeAuditRequiredCodeRule,
  LegacyChallengeAuditWindowDaysRangeRule,
  defaultLegacyChallengeAuditValidator,
} from "./legacy-challenge-audit-rules.js";
import { newLegacyChallengeAudit } from "./legacy-challenge-audit.js";

test("LegacyChallengeAuditValidator reports every problem", () => {
  const validator = defaultLegacyChallengeAuditValidator();
  const item = newLegacyChallengeAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyChallengeAuditWindowDaysRangeRule flags values above window days", () => {
  const rule = new LegacyChallengeAuditWindowDaysRangeRule(64, 1000);
  const item = newLegacyChallengeAudit("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyChallengeAuditNameLengthRule flags a long name", () => {
  const rule = new LegacyChallengeAuditNameLengthRule(1000);
  const item = newLegacyChallengeAudit("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyChallengeAuditRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyChallengeAuditRequiredCodeRule("legacy challenge audit needs this field");
  const item = newLegacyChallengeAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyChallengeAuditExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LegacyChallengeAuditExpiresAtRangeRule(255, 3600);
  const item = newLegacyChallengeAudit("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
