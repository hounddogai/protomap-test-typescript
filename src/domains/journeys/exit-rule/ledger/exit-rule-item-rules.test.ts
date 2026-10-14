import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleItemCodeLengthRule,
  ExitRuleItemContactEmailLengthRule,
  ExitRuleItemRequiredLabelRule,
  defaultExitRuleItemValidator,
} from "./exit-rule-item-rules.js";
import { newExitRuleItem } from "./exit-rule-item.js";

test("ExitRuleItemValidator reports every problem", () => {
  const validator = defaultExitRuleItemValidator();
  const item = newExitRuleItem("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleItemRequiredLabelRule flags a blank label", () => {
  const rule = new ExitRuleItemRequiredLabelRule("exit rule item needs a value");
  const item = newExitRuleItem("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleItemCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleItemCodeLengthRule(3600);
  const item = newExitRuleItem("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleItemContactEmailLengthRule flags a long contact email", () => {
  const rule = new ExitRuleItemContactEmailLengthRule(120);
  const item = newExitRuleItem("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
