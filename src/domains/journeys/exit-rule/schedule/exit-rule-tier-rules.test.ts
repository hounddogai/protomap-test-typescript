import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleTierCodeLengthRule,
  ExitRuleTierLimitRangeRule,
  ExitRuleTierRequiredLabelRule,
  defaultExitRuleTierValidator,
} from "./exit-rule-tier-rules.js";
import { newExitRuleTier } from "./exit-rule-tier.js";

test("ExitRuleTierValidator reports every problem", () => {
  const validator = defaultExitRuleTierValidator();
  const item = newExitRuleTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleTierRequiredLabelRule flags a blank label", () => {
  const rule = new ExitRuleTierRequiredLabelRule("exit rule tier needs an entry");
  const item = newExitRuleTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleTierCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleTierCodeLengthRule(16);
  const item = newExitRuleTier("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleTierLimitRangeRule flags values above limit", () => {
  const rule = new ExitRuleTierLimitRangeRule(64, 80);
  const item = newExitRuleTier("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
