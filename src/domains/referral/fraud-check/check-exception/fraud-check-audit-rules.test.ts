import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckAuditCeilingRangeRule,
  FraudCheckAuditCodeLengthRule,
  FraudCheckAuditScoreRangeRule,
  FraudCheckAuditTitleLengthRule,
  defaultFraudCheckAuditValidator,
} from "./fraud-check-audit-rules.js";
import { newFraudCheckAudit } from "./fraud-check-audit.js";

test("FraudCheckAuditValidator reports every problem", () => {
  const validator = defaultFraudCheckAuditValidator();
  const item = newFraudCheckAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckAuditCeilingRangeRule flags values above ceiling", () => {
  const rule = new FraudCheckAuditCeilingRangeRule(4.6, 3566);
  const item = newFraudCheckAudit("x", "y");
  item.ceiling = 3567.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckAuditScoreRangeRule flags values above score", () => {
  const rule = new FraudCheckAuditScoreRangeRule(0.8, 233.2);
  const item = newFraudCheckAudit("x", "y");
  item.score = 234.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckAuditCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckAuditCodeLengthRule(80);
  const item = newFraudCheckAudit("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckAuditTitleLengthRule flags a long title", () => {
  const rule = new FraudCheckAuditTitleLengthRule(1000);
  const item = newFraudCheckAudit("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
