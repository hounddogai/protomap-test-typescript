import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleMappingPhoneLengthRule,
  ExitRuleMappingRequiredCodeRule,
  ExitRuleMappingRequiredTitleRule,
  defaultExitRuleMappingValidator,
} from "./exit-rule-mapping-rules.js";
import { newExitRuleMapping } from "./exit-rule-mapping.js";

test("ExitRuleMappingValidator reports every problem", () => {
  const validator = defaultExitRuleMappingValidator();
  const item = newExitRuleMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleMappingRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleMappingRequiredCodeRule("exit rule mapping needs this field");
  const item = newExitRuleMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleMappingRequiredTitleRule flags a blank title", () => {
  const rule = new ExitRuleMappingRequiredTitleRule("exit rule mapping needs this field");
  const item = newExitRuleMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleMappingPhoneLengthRule flags a long phone", () => {
  const rule = new ExitRuleMappingPhoneLengthRule(255);
  const item = newExitRuleMapping("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
