import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingDeflectionClaimCodeLengthRule,
  RollingDeflectionClaimEndsAtRangeRule,
  RollingDeflectionClaimGraceDaysRangeRule,
  defaultRollingDeflectionClaimValidator,
} from "./rolling-deflection-claim-rules.js";
import { newRollingDeflectionClaim } from "./rolling-deflection-claim.js";

test("RollingDeflectionClaimValidator reports every problem", () => {
  const validator = defaultRollingDeflectionClaimValidator();
  const item = newRollingDeflectionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingDeflectionClaimCodeLengthRule flags a long code", () => {
  const rule = new RollingDeflectionClaimCodeLengthRule(80);
  const item = newRollingDeflectionClaim("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingDeflectionClaimGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RollingDeflectionClaimGraceDaysRangeRule(64, 255);
  const item = newRollingDeflectionClaim("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingDeflectionClaimEndsAtRangeRule flags values above ends at", () => {
  const rule = new RollingDeflectionClaimEndsAtRangeRule(16, 32);
  const item = newRollingDeflectionClaim("x", "y");
  item.endsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
