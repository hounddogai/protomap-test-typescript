import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofAuditCodeLengthRule,
  ProofAuditJourneyIdLengthRule,
  ProofAuditMinimumRangeRule,
  ProofAuditRequiredJourneyIdRule,
  ProofAuditVersionRangeRule,
  defaultProofAuditValidator,
} from "./proof-audit-rules.js";
import { newProofAudit } from "./proof-audit.js";

test("ProofAuditValidator reports every problem", () => {
  const validator = defaultProofAuditValidator();
  const item = newProofAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofAuditJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ProofAuditJourneyIdLengthRule(64);
  const item = newProofAudit("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofAuditVersionRangeRule flags values above version", () => {
  const rule = new ProofAuditVersionRangeRule(80, 86400);
  const item = newProofAudit("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofAuditMinimumRangeRule flags values above minimum", () => {
  const rule = new ProofAuditMinimumRangeRule(3.4, 2838);
  const item = newProofAudit("x", "y");
  item.minimum = 2839.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofAuditCodeLengthRule flags a long code", () => {
  const rule = new ProofAuditCodeLengthRule(255);
  const item = newProofAudit("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofAuditRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ProofAuditRequiredJourneyIdRule("proof audit needs a value");
  const item = newProofAudit("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
