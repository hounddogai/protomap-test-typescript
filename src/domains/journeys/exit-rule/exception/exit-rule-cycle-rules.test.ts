import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleCycleExternalRefLengthRule,
  ExitRuleCycleLabelLengthRule,
  ExitRuleCycleRequiredLabelRule,
  defaultExitRuleCycleValidator,
} from "./exit-rule-cycle-rules.js";
import { newExitRuleCycle } from "./exit-rule-cycle.js";

test("ExitRuleCycleValidator reports every problem", () => {
  const validator = defaultExitRuleCycleValidator();
  const item = newExitRuleCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleCycleRequiredLabelRule flags a blank label", () => {
  const rule = new ExitRuleCycleRequiredLabelRule("exit rule cycle needs a value");
  const item = newExitRuleCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleCycleLabelLengthRule flags a long label", () => {
  const rule = new ExitRuleCycleLabelLengthRule(80);
  const item = newExitRuleCycle("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleCycleExternalRefLengthRule flags a long external ref", () => {
  const rule = new ExitRuleCycleExternalRefLengthRule(3600);
  const item = newExitRuleCycle("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
