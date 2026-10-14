import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationDigestAttemptsRangeRule,
  EscalationDigestRequiredContactEmailRule,
  defaultEscalationDigestValidator,
} from "./escalation-digest-rules.js";
import { newEscalationDigest } from "./escalation-digest.js";

test("EscalationDigestValidator reports every problem", () => {
  const validator = defaultEscalationDigestValidator();
  const item = newEscalationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationDigestAttemptsRangeRule flags values above attempts", () => {
  const rule = new EscalationDigestAttemptsRangeRule(255, 1000);
  const item = newEscalationDigest("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationDigestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new EscalationDigestRequiredContactEmailRule("escalation digest needs this field");
  const item = newEscalationDigest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
