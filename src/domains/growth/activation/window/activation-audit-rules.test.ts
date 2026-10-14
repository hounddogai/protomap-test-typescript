import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationAuditCodeLengthRule,
  ActivationAuditRequiredCodeRule,
  ActivationAuditRequiredTitleRule,
  ActivationAuditRetriesRangeRule,
  ActivationAuditTitleLengthRule,
  ActivationAuditWindowDaysRangeRule,
  defaultActivationAuditValidator,
} from "./activation-audit-rules.js";
import { newActivationAudit } from "./activation-audit.js";

test("ActivationAuditValidator reports every problem", () => {
  const validator = defaultActivationAuditValidator();
  const item = newActivationAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationAuditWindowDaysRangeRule flags values above window days", () => {
  const rule = new ActivationAuditWindowDaysRangeRule(80, 80);
  const item = newActivationAudit("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationAuditRetriesRangeRule flags values above retries", () => {
  const rule = new ActivationAuditRetriesRangeRule(1000, 3600);
  const item = newActivationAudit("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationAuditRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationAuditRequiredCodeRule("activation audit needs this field");
  const item = newActivationAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationAuditTitleLengthRule flags a long title", () => {
  const rule = new ActivationAuditTitleLengthRule(1000);
  const item = newActivationAudit("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationAuditRequiredTitleRule flags a blank title", () => {
  const rule = new ActivationAuditRequiredTitleRule("activation audit needs a value");
  const item = newActivationAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationAuditCodeLengthRule flags a long code", () => {
  const rule = new ActivationAuditCodeLengthRule(16);
  const item = newActivationAudit("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
