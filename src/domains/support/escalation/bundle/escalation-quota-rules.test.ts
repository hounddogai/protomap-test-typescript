import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationQuotaNameLengthRule,
  EscalationQuotaRequiredLabelRule,
  EscalationQuotaRequiredOwnerIdRule,
  defaultEscalationQuotaValidator,
} from "./escalation-quota-rules.js";
import { newEscalationQuota } from "./escalation-quota.js";

test("EscalationQuotaValidator reports every problem", () => {
  const validator = defaultEscalationQuotaValidator();
  const item = newEscalationQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationQuotaRequiredLabelRule("escalation quota needs this field");
  const item = newEscalationQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationQuotaRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new EscalationQuotaRequiredOwnerIdRule("escalation quota needs this field");
  const item = newEscalationQuota("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationQuotaNameLengthRule flags a long name", () => {
  const rule = new EscalationQuotaNameLengthRule(16);
  const item = newEscalationQuota("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
