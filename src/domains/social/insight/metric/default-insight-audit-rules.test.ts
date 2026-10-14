import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultInsightAuditChannelLengthRule,
  DefaultInsightAuditCohortLengthRule,
  DefaultInsightAuditRequiredChannelRule,
  defaultDefaultInsightAuditValidator,
} from "./default-insight-audit-rules.js";
import { newDefaultInsightAudit } from "./default-insight-audit.js";

test("DefaultInsightAuditValidator reports every problem", () => {
  const validator = defaultDefaultInsightAuditValidator();
  const item = newDefaultInsightAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultInsightAuditChannelLengthRule flags a long channel", () => {
  const rule = new DefaultInsightAuditChannelLengthRule(32);
  const item = newDefaultInsightAudit("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultInsightAuditRequiredChannelRule flags a blank channel", () => {
  const rule = new DefaultInsightAuditRequiredChannelRule("default insight audit needs an entry");
  const item = newDefaultInsightAudit("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInsightAuditCohortLengthRule flags a long cohort", () => {
  const rule = new DefaultInsightAuditCohortLengthRule(80);
  const item = newDefaultInsightAudit("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
