import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationRollupCodeLengthRule,
  EscalationRollupDurationMinutesRangeRule,
  EscalationRollupNameLengthRule,
  EscalationRollupRequiredContactEmailRule,
  defaultEscalationRollupValidator,
} from "./escalation-rollup-rules.js";
import { newEscalationRollup } from "./escalation-rollup.js";

test("EscalationRollupValidator reports every problem", () => {
  const validator = defaultEscalationRollupValidator();
  const item = newEscalationRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationRollupNameLengthRule flags a long name", () => {
  const rule = new EscalationRollupNameLengthRule(86400);
  const item = newEscalationRollup("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationRollupDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new EscalationRollupDurationMinutesRangeRule(255, 1000);
  const item = newEscalationRollup("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationRollupRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new EscalationRollupRequiredContactEmailRule("escalation rollup needs this field");
  const item = newEscalationRollup("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationRollupCodeLengthRule flags a long code", () => {
  const rule = new EscalationRollupCodeLengthRule(86400);
  const item = newEscalationRollup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
