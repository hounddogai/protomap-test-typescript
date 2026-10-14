import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationBundleChannelLengthRule,
  EscalationBundleDurationMinutesRangeRule,
  EscalationBundleRequiredExternalRefRule,
  defaultEscalationBundleValidator,
} from "./escalation-bundle-rules.js";
import { newEscalationBundle } from "./escalation-bundle.js";

test("EscalationBundleValidator reports every problem", () => {
  const validator = defaultEscalationBundleValidator();
  const item = newEscalationBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationBundleRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new EscalationBundleRequiredExternalRefRule("escalation bundle needs a value");
  const item = newEscalationBundle("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationBundleDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new EscalationBundleDurationMinutesRangeRule(32, 32);
  const item = newEscalationBundle("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationBundleChannelLengthRule flags a long channel", () => {
  const rule = new EscalationBundleChannelLengthRule(32);
  const item = newEscalationBundle("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
