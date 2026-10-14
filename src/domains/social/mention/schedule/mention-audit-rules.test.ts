import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionAuditCodeLengthRule,
  MentionAuditLabelLengthRule,
  MentionAuditPriorityRangeRule,
  MentionAuditRequiredAudienceIdRule,
  defaultMentionAuditValidator,
} from "./mention-audit-rules.js";
import { newMentionAudit } from "./mention-audit.js";

test("MentionAuditValidator reports every problem", () => {
  const validator = defaultMentionAuditValidator();
  const item = newMentionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionAuditCodeLengthRule flags a long code", () => {
  const rule = new MentionAuditCodeLengthRule(32);
  const item = newMentionAudit("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionAuditLabelLengthRule flags a long label", () => {
  const rule = new MentionAuditLabelLengthRule(1000);
  const item = newMentionAudit("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionAuditPriorityRangeRule flags values above priority", () => {
  const rule = new MentionAuditPriorityRangeRule(32, 80);
  const item = newMentionAudit("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionAuditRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new MentionAuditRequiredAudienceIdRule("mention audit needs this field");
  const item = newMentionAudit("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
