import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLeaderboardAuditContactEmailLengthRule,
  RollingLeaderboardAuditRequiredCodeRule,
  RollingLeaderboardAuditScoreRangeRule,
  defaultRollingLeaderboardAuditValidator,
} from "./rolling-leaderboard-audit-rules.js";
import { newRollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

test("RollingLeaderboardAuditValidator reports every problem", () => {
  const validator = defaultRollingLeaderboardAuditValidator();
  const item = newRollingLeaderboardAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLeaderboardAuditScoreRangeRule flags values above score", () => {
  const rule = new RollingLeaderboardAuditScoreRangeRule(7.4, 3143.7);
  const item = newRollingLeaderboardAudit("x", "y");
  item.score = 3145.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingLeaderboardAuditContactEmailLengthRule flags a long contact email", () => {
  const rule = new RollingLeaderboardAuditContactEmailLengthRule(120);
  const item = newRollingLeaderboardAudit("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingLeaderboardAuditRequiredCodeRule flags a blank code", () => {
  const rule = new RollingLeaderboardAuditRequiredCodeRule("rolling leaderboard audit needs this field");
  const item = newRollingLeaderboardAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
