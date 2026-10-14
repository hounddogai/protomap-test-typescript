import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationAdjustmentContactEmailLengthRule,
  EscalationAdjustmentRequiredChannelRule,
  EscalationAdjustmentRequiredNameRule,
  EscalationAdjustmentRevisionRangeRule,
  defaultEscalationAdjustmentValidator,
} from "./escalation-adjustment-rules.js";
import { newEscalationAdjustment } from "./escalation-adjustment.js";

test("EscalationAdjustmentValidator reports every problem", () => {
  const validator = defaultEscalationAdjustmentValidator();
  const item = newEscalationAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationAdjustmentRevisionRangeRule flags values above revision", () => {
  const rule = new EscalationAdjustmentRevisionRangeRule(80, 3600);
  const item = newEscalationAdjustment("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new EscalationAdjustmentRequiredNameRule("escalation adjustment needs this field");
  const item = newEscalationAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationAdjustmentRequiredChannelRule flags a blank channel", () => {
  const rule = new EscalationAdjustmentRequiredChannelRule("escalation adjustment needs an entry");
  const item = newEscalationAdjustment("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationAdjustmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new EscalationAdjustmentContactEmailLengthRule(255);
  const item = newEscalationAdjustment("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
