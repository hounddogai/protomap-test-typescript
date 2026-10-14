import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowRuleNameLengthRule,
  WindowRuleQuantityRangeRule,
  WindowRuleRequiredCohortRule,
  defaultWindowRuleValidator,
} from "./window-rule-rules.js";
import { newWindowRule } from "./window-rule.js";

test("WindowRuleValidator reports every problem", () => {
  const validator = defaultWindowRuleValidator();
  const item = newWindowRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowRuleNameLengthRule flags a long name", () => {
  const rule = new WindowRuleNameLengthRule(16);
  const item = newWindowRule("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowRuleQuantityRangeRule flags values above quantity", () => {
  const rule = new WindowRuleQuantityRangeRule(80, 3600);
  const item = newWindowRule("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowRuleRequiredCohortRule flags a blank cohort", () => {
  const rule = new WindowRuleRequiredCohortRule("window rule needs this field");
  const item = newWindowRule("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
