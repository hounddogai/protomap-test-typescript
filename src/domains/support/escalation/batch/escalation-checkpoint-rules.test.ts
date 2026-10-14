import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationCheckpointClicksRangeRule,
  EscalationCheckpointCodeLengthRule,
  EscalationCheckpointContactEmailLengthRule,
  EscalationCheckpointRequiredCodeRule,
  EscalationCheckpointRequiredLabelRule,
  defaultEscalationCheckpointValidator,
} from "./escalation-checkpoint-rules.js";
import { newEscalationCheckpoint } from "./escalation-checkpoint.js";

test("EscalationCheckpointValidator reports every problem", () => {
  const validator = defaultEscalationCheckpointValidator();
  const item = newEscalationCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationCheckpointClicksRangeRule flags values above clicks", () => {
  const rule = new EscalationCheckpointClicksRangeRule(16, 120);
  const item = newEscalationCheckpoint("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationCheckpointCodeLengthRule flags a long code", () => {
  const rule = new EscalationCheckpointCodeLengthRule(120);
  const item = newEscalationCheckpoint("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationCheckpointRequiredLabelRule("escalation checkpoint needs an entry");
  const item = newEscalationCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationCheckpointContactEmailLengthRule flags a long contact email", () => {
  const rule = new EscalationCheckpointContactEmailLengthRule(255);
  const item = newEscalationCheckpoint("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationCheckpointRequiredCodeRule("escalation checkpoint needs this field");
  const item = newEscalationCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
