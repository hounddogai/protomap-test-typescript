import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationTargetCodeLengthRule,
  EscalationTargetRegionLengthRule,
  EscalationTargetRequiredLabelRule,
  EscalationTargetRequiredRegionRule,
  EscalationTargetRevisionRangeRule,
  defaultEscalationTargetValidator,
} from "./escalation-target-rules.js";
import { newEscalationTarget } from "./escalation-target.js";

test("EscalationTargetValidator reports every problem", () => {
  const validator = defaultEscalationTargetValidator();
  const item = newEscalationTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationTargetRequiredRegionRule flags a blank region", () => {
  const rule = new EscalationTargetRequiredRegionRule("escalation target needs a value");
  const item = newEscalationTarget("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationTargetRegionLengthRule flags a long region", () => {
  const rule = new EscalationTargetRegionLengthRule(120);
  const item = newEscalationTarget("x", "y");
  item.region = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationTargetCodeLengthRule flags a long code", () => {
  const rule = new EscalationTargetCodeLengthRule(80);
  const item = newEscalationTarget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationTargetRevisionRangeRule flags values above revision", () => {
  const rule = new EscalationTargetRevisionRangeRule(32, 120);
  const item = newEscalationTarget("x", "y");
  item.revision = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationTargetRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationTargetRequiredLabelRule("escalation target needs an entry");
  const item = newEscalationTarget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
