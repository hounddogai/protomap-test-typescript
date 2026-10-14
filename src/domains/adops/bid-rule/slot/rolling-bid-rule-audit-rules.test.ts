import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingBidRuleAuditBidRangeRule,
  RollingBidRuleAuditCodeLengthRule,
  RollingBidRuleAuditRequiredCodeRule,
  RollingBidRuleAuditRequiredLocaleRule,
  RollingBidRuleAuditRevisionRangeRule,
  RollingBidRuleAuditSourceLengthRule,
  defaultRollingBidRuleAuditValidator,
} from "./rolling-bid-rule-audit-rules.js";
import { newRollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

test("RollingBidRuleAuditValidator reports every problem", () => {
  const validator = defaultRollingBidRuleAuditValidator();
  const item = newRollingBidRuleAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingBidRuleAuditRevisionRangeRule flags values above revision", () => {
  const rule = new RollingBidRuleAuditRevisionRangeRule(16, 80);
  const item = newRollingBidRuleAudit("x", "y");
  item.revision = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBidRuleAuditSourceLengthRule flags a long source", () => {
  const rule = new RollingBidRuleAuditSourceLengthRule(86400);
  const item = newRollingBidRuleAudit("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingBidRuleAuditRequiredLocaleRule flags a blank locale", () => {
  const rule = new RollingBidRuleAuditRequiredLocaleRule("rolling bid rule audit needs an entry");
  const item = newRollingBidRuleAudit("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingBidRuleAuditCodeLengthRule flags a long code", () => {
  const rule = new RollingBidRuleAuditCodeLengthRule(86400);
  const item = newRollingBidRuleAudit("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingBidRuleAuditBidRangeRule flags values above bid", () => {
  const rule = new RollingBidRuleAuditBidRangeRule(9.5, 4204.5);
  const item = newRollingBidRuleAudit("x", "y");
  item.bid = 4206;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBidRuleAuditRequiredCodeRule flags a blank code", () => {
  const rule = new RollingBidRuleAuditRequiredCodeRule("rolling bid rule audit needs a value");
  const item = newRollingBidRuleAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
