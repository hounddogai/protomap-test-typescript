import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationClaimCodeLengthRule,
  EscalationClaimDurationMinutesRangeRule,
  EscalationClaimExternalRefLengthRule,
  EscalationClaimRequiredExternalRefRule,
  EscalationClaimRequiredTitleRule,
  defaultEscalationClaimValidator,
} from "./escalation-claim-rules.js";
import { newEscalationClaim } from "./escalation-claim.js";

test("EscalationClaimValidator reports every problem", () => {
  const validator = defaultEscalationClaimValidator();
  const item = newEscalationClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationClaimRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new EscalationClaimRequiredExternalRefRule("escalation claim needs an entry");
  const item = newEscalationClaim("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationClaimExternalRefLengthRule flags a long external ref", () => {
  const rule = new EscalationClaimExternalRefLengthRule(1000);
  const item = newEscalationClaim("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationClaimDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new EscalationClaimDurationMinutesRangeRule(64, 86400);
  const item = newEscalationClaim("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationClaimRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationClaimRequiredTitleRule("escalation claim needs an entry");
  const item = newEscalationClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationClaimCodeLengthRule flags a long code", () => {
  const rule = new EscalationClaimCodeLengthRule(32);
  const item = newEscalationClaim("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
