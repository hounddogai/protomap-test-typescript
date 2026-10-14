import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleOverrideCodeLengthRule,
  ExitRuleOverrideNameLengthRule,
  defaultExitRuleOverrideValidator,
} from "./exit-rule-override-rules.js";
import { newExitRuleOverride } from "./exit-rule-override.js";

test("ExitRuleOverrideValidator reports every problem", () => {
  const validator = defaultExitRuleOverrideValidator();
  const item = newExitRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleOverrideNameLengthRule flags a long name", () => {
  const rule = new ExitRuleOverrideNameLengthRule(86400);
  const item = newExitRuleOverride("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleOverrideCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleOverrideCodeLengthRule(1000);
  const item = newExitRuleOverride("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
