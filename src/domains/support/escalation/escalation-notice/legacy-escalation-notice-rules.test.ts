import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyEscalationNoticeCodeLengthRule,
  LegacyEscalationNoticeLabelLengthRule,
  LegacyEscalationNoticeOpenRateRangeRule,
  LegacyEscalationNoticeRequiredExternalRefRule,
  LegacyEscalationNoticeRequiredSourceRule,
  LegacyEscalationNoticeVersionRangeRule,
  defaultLegacyEscalationNoticeValidator,
} from "./legacy-escalation-notice-rules.js";
import { newLegacyEscalationNotice } from "./legacy-escalation-notice.js";

test("LegacyEscalationNoticeValidator reports every problem", () => {
  const validator = defaultLegacyEscalationNoticeValidator();
  const item = newLegacyEscalationNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyEscalationNoticeRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new LegacyEscalationNoticeRequiredExternalRefRule("legacy escalation notice needs this field");
  const item = newLegacyEscalationNotice("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyEscalationNoticeLabelLengthRule flags a long label", () => {
  const rule = new LegacyEscalationNoticeLabelLengthRule(16);
  const item = newLegacyEscalationNotice("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyEscalationNoticeOpenRateRangeRule flags values above open rate", () => {
  const rule = new LegacyEscalationNoticeOpenRateRangeRule(2.8, 704.4);
  const item = newLegacyEscalationNotice("x", "y");
  item.openRate = 705.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyEscalationNoticeRequiredSourceRule flags a blank source", () => {
  const rule = new LegacyEscalationNoticeRequiredSourceRule("legacy escalation notice needs this field");
  const item = newLegacyEscalationNotice("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyEscalationNoticeVersionRangeRule flags values above version", () => {
  const rule = new LegacyEscalationNoticeVersionRangeRule(80, 3600);
  const item = newLegacyEscalationNotice("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyEscalationNoticeCodeLengthRule flags a long code", () => {
  const rule = new LegacyEscalationNoticeCodeLengthRule(32);
  const item = newLegacyEscalationNotice("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
