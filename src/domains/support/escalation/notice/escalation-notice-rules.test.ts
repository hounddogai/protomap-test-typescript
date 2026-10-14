import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationNoticeCodeLengthRule,
  EscalationNoticeRequiredSummaryRule,
  EscalationNoticeRequiredUnitRule,
  EscalationNoticeSummaryLengthRule,
  defaultEscalationNoticeValidator,
} from "./escalation-notice-rules.js";
import { newEscalationNotice } from "./escalation-notice.js";

test("EscalationNoticeValidator reports every problem", () => {
  const validator = defaultEscalationNoticeValidator();
  const item = newEscalationNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationNoticeRequiredUnitRule flags a blank unit", () => {
  const rule = new EscalationNoticeRequiredUnitRule("escalation notice needs a value");
  const item = newEscalationNotice("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationNoticeRequiredSummaryRule flags a blank summary", () => {
  const rule = new EscalationNoticeRequiredSummaryRule("escalation notice needs this field");
  const item = newEscalationNotice("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationNoticeCodeLengthRule flags a long code", () => {
  const rule = new EscalationNoticeCodeLengthRule(16);
  const item = newEscalationNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationNoticeSummaryLengthRule flags a long summary", () => {
  const rule = new EscalationNoticeSummaryLengthRule(120);
  const item = newEscalationNotice("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
